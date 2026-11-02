import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc, limit, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, X, Trash2, Eye, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { normalizeUrl, renderTextWithLinks } from '../lib/linkify';

export default function AdminStatusRow() {
  const { user, profile } = useAuth();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [viewCount, setViewCount] = useState<number | null>(null);

  // Upload Preview Modal State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [statusCaption, setStatusCaption] = useState('');
  const [statusLinkUrl, setStatusLinkUrl] = useState('');
  const [statusLinkLabel, setStatusLinkLabel] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSuperAdmin = user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';
  const isAdmin = isSuperAdmin || (profile?.role === 'community_manager' && !!profile?.managerPermissions?.canPostStatus);

  const fetchStatuses = async () => {
    if (!user) return;
    const q = query(collection(db, 'admin_statuses'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((s: any) => !s.isMigrationNotice);
    setStatuses(data);
  };

  useEffect(() => {
    fetchStatuses();
  }, [user]);

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject('Invalid video file');
      video.src = window.URL.createObjectURL(file);
    });
  };

  const uploadFileToCloudinaryWithProgress = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      setUploadProgress(50);
      const fallbackUrl = await uploadFileToCloudinary(file);
      setUploadProgress(100);
      return fallbackUrl;
    }

    return new Promise((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      // Update progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded * 100.0) / e.total);
          setUploadProgress(progress);
        }
      });

      xhr.onreadystatechange = async () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else if (xhr.readyState === 4) {
          try {
            const fallbackUrl = await uploadFileToCloudinary(file);
            resolve(fallbackUrl);
          } catch (err) {
            reject(err);
          }
        }
      };

      fd.append('upload_preset', uploadPreset);
      fd.append('file', file);
      xhr.send(fd);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    
    if (statuses.length >= 10) {
      toast.error("Maximum 10 statuses allowed. Please delete older ones.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check video duration
    if (file.type.startsWith('video/')) {
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 61) { // 61 seconds to be safe
          toast.error("Video length must be 1 minute or less.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      } catch (err) {
        toast.error("Invalid video file.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // Max size 50MB for video to accommodate 720p 1 min video
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File is too large (max 50MB)");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setStatusCaption('');
    setStatusLinkUrl('');
    setStatusLinkLabel('');
    setIsUploadModalOpen(true);
  };

  const handleCancelUpload = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setStatusCaption('');
    setStatusLinkUrl('');
    setStatusLinkLabel('');
    setIsUploadModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingFile || !user || !isAdmin) return;

    setIsUploadModalOpen(false);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const url = await uploadFileToCloudinaryWithProgress(pendingFile);
      const normalizedLink = statusLinkUrl.trim() ? normalizeUrl(statusLinkUrl.trim()) : null;
      
      await addDoc(collection(db, 'admin_statuses'), {
        imageUrl: url,
        type: pendingFile.type.startsWith('video/') ? 'video' : 'image',
        caption: statusCaption.trim() || null,
        linkUrl: normalizedLink,
        linkLabel: statusLinkLabel.trim() || 'Open Link ↗',
        createdAt: serverTimestamp(),
        authorId: user.uid
      });
      toast.success("Status posted!");
      await fetchStatuses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload status");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
      setPendingFile(null);
      setPendingPreviewUrl(null);
      setStatusCaption('');
      setStatusLinkUrl('');
      setStatusLinkLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const handleReply = async (type: 'text' | 'reaction', contentStr: string) => {
    if (!user || activeStatusIndex === null) return;
    try {
      await addDoc(collection(db, 'status_replies'), {
        statusId: statuses[activeStatusIndex].id,
        type,
        content: contentStr,
        senderId: user.uid,
        senderName: profile?.fullName || 'User',
        createdAt: serverTimestamp()
      });
      if (type === 'text') {
        setReplyText('');
        toast.success("Reply sent!");
      } else {
        toast.success("Reaction sent!");
      }
    } catch (e: any) {
      console.error("Reply error:", e);
      toast.error("Failed to send reply: " + (e.message || ''));
    }
  };

  useEffect(() => {
    if (activeStatusIndex !== null && statuses[activeStatusIndex] && user) {
      const statusId = statuses[activeStatusIndex].id;
      
      // Record view
      setDoc(doc(db, 'admin_statuses', statusId, 'views', user.uid), {
        viewedAt: serverTimestamp()
      }).catch(err => console.error("Failed to record view", err));

      // Fetch view count for all users
      setViewCount(null);
      getDocs(collection(db, 'admin_statuses', statusId, 'views'))
        .then(snapshot => {
          setViewCount(snapshot.size);
        })
        .catch(err => console.error("Failed to get view count", err));
    }
  }, [activeStatusIndex, statuses, user, isAdmin]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    try {
      if (statuses.length <= 1) {
        setActiveStatusIndex(null);
      } else if (activeStatusIndex !== null && activeStatusIndex >= statuses.length - 1) {
        setActiveStatusIndex(activeStatusIndex - 1);
        setVideoProgress(0);
      }
      
      await deleteDoc(doc(db, 'admin_statuses', id));
      setStatuses(prev => prev.filter(s => s.id !== id));
      toast.success("Status deleted");
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Failed to delete status");
    }
  };

  if (!isAdmin && statuses.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-3 px-4 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      {isAdmin && (
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 hover:border-blue-400 transition-all relative"
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-full z-10">
                <div className="text-[10px] font-bold text-blue-600">{Math.round(uploadProgress)}%</div>
                <div className="w-8 h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <Plus className="w-6 h-6 text-slate-400" />
            )}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Add Status</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*,video/*" 
            className="hidden" 
          />
        </div>
      )}

      {statuses.length > 0 && (
        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group" onClick={() => setActiveStatusIndex(0)}>
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 group-hover:scale-105 transition-transform">
            {statuses[0].type === 'video' ? (
              <video src={statuses[0].imageUrl} className="w-full h-full rounded-full object-cover border-2 border-white" muted playsInline />
            ) : (
              <img src={statuses[0].imageUrl} alt="Status" className="w-full h-full rounded-full object-cover border-2 border-white" />
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Admin</span>
        </div>
      )}

      {/* Ad in empty space */}
      <div className="ml-auto shrink-0 flex items-center justify-end w-full overflow-hidden bg-transparent">
      </div>

      {/* Upload Preview & Link/Caption Modal */}
      <AnimatePresence>
        {isUploadModalOpen && pendingFile && pendingPreviewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[320] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCancelUpload}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Post Admin Status</h3>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmUpload} className="p-4 space-y-4 overflow-y-auto">
                <div className="w-full h-52 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  {pendingFile.type.startsWith('video/') ? (
                    <video src={pendingPreviewUrl} controls className="max-w-full max-h-full object-contain" />
                  ) : (
                    <img src={pendingPreviewUrl} alt="Status preview" className="max-w-full max-h-full object-contain" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Caption / Text (Optional - Links will be clickable)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write a caption or paste a link (e.g. https://jee-community.netlify.app)..."
                    value={statusCaption}
                    onChange={(e) => setStatusCaption(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Add Clickable Link Button on Status (Optional)</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Paste URL (e.g. https://jee-community.netlify.app/community)"
                      value={statusLinkUrl}
                      onChange={(e) => setStatusLinkUrl(e.target.value)}
                      className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  {statusLinkUrl.trim() && (
                    <div>
                      <input
                        type="text"
                        placeholder="Button Text (Default: Open Link ↗)"
                        value={statusLinkLabel}
                        onChange={(e) => setStatusLinkLabel(e.target.value)}
                        className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                  >
                    Post Status
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Viewer */}
      <AnimatePresence>
        {activeStatusIndex !== null && statuses[activeStatusIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
          >
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {statuses.map((status, idx) => {
                const isActive = idx === activeStatusIndex;
                const isPast = idx < activeStatusIndex;
                const isVideo = status.type === 'video';
                const hasExtraContent = !!(status.linkUrl || status.caption);

                return (
                  <div key={status.id} className="h-1 flex-1 bg-white/30 dark:bg-slate-900/30 rounded-full overflow-hidden">
                    {isVideo && isActive ? (
                      <div 
                        className="h-full bg-white dark:bg-slate-900 transition-all duration-100 ease-linear" 
                        style={{ width: `${videoProgress}%` }}
                      />
                    ) : (
                      <motion.div 
                        key={activeStatusIndex}
                        initial={{ width: isPast ? '100%' : '0%' }}
                        animate={{ width: isPast ? '100%' : isActive ? '100%' : '0%' }}
                        transition={isActive ? { duration: hasExtraContent ? 8 : 5, ease: 'linear' } : { duration: 0 }}
                        onAnimationComplete={() => {
                          if (isActive && !isVideo) {
                            if (activeStatusIndex < statuses.length - 1) {
                              setActiveStatusIndex(activeStatusIndex + 1);
                              setVideoProgress(0);
                            } else {
                              setActiveStatusIndex(null);
                            }
                          }
                        }}
                        className="h-full bg-white dark:bg-slate-900"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50 pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 text-blue-700 font-bold shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                  A
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm shadow-black">Admin</h3>
                  <p className="text-white/70 text-[10px] font-medium shadow-black">
                    {statuses[activeStatusIndex]?.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 text-white font-medium text-sm backdrop-blur-md pointer-events-auto shadow-lg border border-white/10">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>{viewCount !== null ? viewCount : '-'}</span>
                </div>
                {isAdmin && (
                  <button onClick={(e) => handleDelete(statuses[activeStatusIndex].id, e)} className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors pointer-events-auto">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                )}
                <button onClick={() => setActiveStatusIndex(null)} className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors pointer-events-auto">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content & Navigation Areas */}
            <div className="flex-1 relative flex items-center justify-center">
              <div 
                className="absolute inset-y-0 left-0 w-1/3 z-10" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (activeStatusIndex > 0) {
                    setActiveStatusIndex(activeStatusIndex - 1);
                    setVideoProgress(0);
                  }
                }} 
              />
              
              {statuses[activeStatusIndex].type === 'video' ? (
                <video 
                  src={statuses[activeStatusIndex].imageUrl} 
                  autoPlay 
                  playsInline
                  controls
                  muted={false}
                  onTimeUpdate={(e) => {
                    const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
                    setVideoProgress(progress);
                  }}
                  onEnded={() => {
                    if (activeStatusIndex < statuses.length - 1) {
                      setActiveStatusIndex(activeStatusIndex + 1);
                      setVideoProgress(0);
                    } else {
                      setActiveStatusIndex(null);
                    }
                  }}
                  className="max-w-full max-h-full object-contain" 
                />
              ) : (
                <img 
                  src={statuses[activeStatusIndex].imageUrl} 
                  alt="Status" 
                  className="max-w-full max-h-full object-contain" 
                />
              )}

              <div 
                className="absolute inset-y-0 right-0 w-1/3 z-10" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (activeStatusIndex < statuses.length - 1) {
                    setActiveStatusIndex(activeStatusIndex + 1);
                    setVideoProgress(0);
                  } else {
                    setActiveStatusIndex(null);
                  }
                }} 
              />
            </div>

            {/* Clickable Link Button & Caption + Reply Bar */}
            <div
              className="absolute bottom-4 left-4 right-4 z-30 flex flex-col gap-2.5 max-w-xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {statuses[activeStatusIndex].linkUrl && (
                <div className="flex justify-center">
                  <a
                    href={normalizeUrl(statuses[activeStatusIndex].linkUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-[0_8px_25px_rgba(59,130,246,0.5)] border-2 border-white/30 active:scale-95 transition-all animate-bounce"
                  >
                    <span>{statuses[activeStatusIndex].linkLabel || 'Open Link ↗'}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              )}

              {statuses[activeStatusIndex].caption && (
                <div className="bg-black/65 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center shadow-lg max-h-28 overflow-y-auto">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {renderTextWithLinks(statuses[activeStatusIndex].caption, {
                      linkClassName: 'text-sky-300 hover:text-sky-200 underline font-extrabold break-all cursor-pointer',
                    })}
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4 mb-1">
                {['❤️', '😂', '😮', '😢', '🔥', '👏'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={(e) => { e.stopPropagation(); handleReply('reaction', emoji); }}
                    className="text-3xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <input 
                  type="text" 
                  placeholder="Reply to admin..." 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && replyText.trim()) {
                      e.stopPropagation();
                      handleReply('text', replyText);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm"
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (replyText.trim()) handleReply('text', replyText);
                  }}
                  className="text-white font-bold text-sm bg-blue-500 px-4 py-1.5 rounded-full"
                >
                  Send
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
