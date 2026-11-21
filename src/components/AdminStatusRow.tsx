import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  X,
  Trash2,
  Eye,
  ExternalLink,
  Link as LinkIcon,
  Coffee,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { normalizeUrl, renderTextWithLinks } from '../lib/linkify';
import {
  getInstantAdminStatuses,
  fetchSupabaseAdminStatuses,
  saveSupabaseAdminStatus,
  deleteSupabaseAdminStatus,
  recordSupabaseStatusInteraction,
  createSupabaseNotification,
} from '../lib/supabaseHub';

const BUY_ME_A_CHAI_URL = 'https://rzp.io/rzp/buy-me-a-chai-jee';

export default function AdminStatusRow() {
  const { user, profile } = useAuth();
  const [statuses, setStatuses] = useState<any[]>(() => getInstantAdminStatuses());

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [viewCount, setViewCount] = useState<number | null>(null);

  // Upload Preview Modal State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [statusCaption, setStatusCaption] = useState('');
  const [statusLinkUrl, setStatusLinkUrl] = useState('');
  const [statusLinkLabel, setStatusLinkLabel] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSuperAdmin =
    user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';
  const isAdmin =
    isSuperAdmin ||
    (profile?.role === 'community_manager' && !!profile?.managerPermissions?.canPostStatus);

  const fetchStatuses = useCallback(async (force = false) => {
    const list = await fetchSupabaseAdminStatuses(force);
    setStatuses(list);
  }, []);

  useEffect(() => {
    fetchStatuses(false);
  }, [fetchStatuses]);

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
      toast.error('Maximum 10 statuses allowed. Please delete older ones.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.type.startsWith('video/')) {
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 61) {
          toast.error('Video length must be 1 minute or less.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      } catch {
        toast.error('Invalid video file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File is too large (max 50MB)');
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

      await saveSupabaseAdminStatus({
        imageUrl: url,
        type: pendingFile.type.startsWith('video/') ? 'video' : 'image',
        caption: statusCaption.trim() || null,
        linkUrl: normalizedLink,
        linkLabel: statusLinkLabel.trim() || 'Open Link ↗',
        createdAtMs: Date.now(),
        authorId: user.uid,
        viewsCount: 1,
        wishesCount: 0,
      });
      toast.success('Status posted!');
      await fetchStatuses(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload status');
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
    const activeStatus = statuses[activeStatusIndex];
    try {
      if (type === 'text') {
        setReplyText('');
        toast.success('Reply sent to Admin!');
      } else {
        toast.success(`Sent ${contentStr} to Admin!`);
      }
      await createSupabaseNotification({
        recipientId: activeStatus?.authorId || 'admin',
        senderId: user.uid,
        senderName: profile?.fullName || 'Student',
        senderAvatar: profile?.photoURL || '',
        type: 'status_reply',
        commentContent: `${type === 'reaction' ? 'Reacted' : 'Replied'} on Status: ${contentStr}`,
        targetUrl: '/community',
      });
    } catch (e: any) {
      console.error('Reply error:', e);
    }
  };

  useEffect(() => {
    if (activeStatusIndex !== null && statuses[activeStatusIndex] && user) {
      const currentStatus = statuses[activeStatusIndex];
      setViewCount(Number(currentStatus.viewsCount) || 1);

      const viewedKey = `jee_status_viewed_${currentStatus.id}`;
      let alreadyViewed = false;
      try {
        alreadyViewed = sessionStorage.getItem(viewedKey) === '1';
      } catch {
        // ignore
      }

      if (!alreadyViewed) {
        try {
          sessionStorage.setItem(viewedKey, '1');
        } catch {
          // ignore
        }
        recordSupabaseStatusInteraction(currentStatus, 'view')
          .then((res) => {
            setViewCount(res.viewsCount);
            setStatuses((prev) =>
              prev.map((s) =>
                s.id === currentStatus.id ? { ...s, viewsCount: res.viewsCount } : s
              )
            );
          })
          .catch(() => {});
      }
    }
  }, [activeStatusIndex, user]);

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

      await deleteSupabaseAdminStatus(id);
      const updated = await fetchSupabaseAdminStatuses(true);
      setStatuses(updated);
      toast.success('Status removed');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete status');
    }
  };

  const openStatusAtIndex = (idx: number) => {
    setVideoProgress(0);
    setActiveStatusIndex(idx);
  };

  const hasStatusItems = isAdmin || statuses.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 flex items-center gap-3.5 overflow-x-auto no-scrollbar">
      {isAdmin && (
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full border-2 border-dashed border-blue-400 dark:border-blue-500/60 flex items-center justify-center bg-slate-50 dark:bg-slate-800/80 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-500 transition-colors relative"
            title="Upload Admin Status"
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center absolute inset-0 bg-white/95 dark:bg-slate-900/95 rounded-full z-10">
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {Math.round(uploadProgress)}%
                </div>
                <div className="w-8 h-1 bg-blue-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <Plus className="w-2.5 h-2.5 text-white" />
            </div>
          </button>
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Add Status
          </span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>
      )}

      {/* Admin Status Circles */}
      {statuses.map((statusItem, idx) => (
        <button
          key={statusItem.id}
          type="button"
          onClick={() => openStatusAtIndex(idx)}
          className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 group-hover:scale-105 transition-transform relative">
            {statusItem.type === 'video' ? (
              <video
                src={statusItem.imageUrl}
                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                muted
                playsInline
              />
            ) : (
              <img
                src={statusItem.imageUrl}
                alt="Admin Status"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
              />
            )}
          </div>
          <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Admin
          </span>
        </button>
      ))}

      {/* Buy Me a Chai Card in the Empty Space Next to Status Circles */}
      <a
        href={BUY_ME_A_CHAI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${
          hasStatusItems ? 'ml-auto shrink-0' : 'w-full justify-between'
        } min-h-[52px] flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/90 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer group text-left`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 border border-amber-200/80 dark:border-amber-700/50 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
            Buy Me a Chai
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </a>

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
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Post Admin Status
                </h3>
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
                    <video
                      src={pendingPreviewUrl}
                      controls
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <img
                      src={pendingPreviewUrl}
                      alt="Status preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Caption / Text (Optional - Links will be clickable)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write a caption or paste a link..."
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

      {/* Full-Screen Status Viewer */}
      <AnimatePresence>
        {activeStatusIndex !== null && statuses[activeStatusIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
          >
            {/* Story Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-40">
              {statuses.map((status, idx) => {
                const isActive = idx === activeStatusIndex;
                const isPast = idx < activeStatusIndex;
                const isTimedVideo = status.type === 'video';
                const hasExtraContent = !!(status.linkUrl || status.caption);

                return (
                  <div
                    key={status.id}
                    className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden"
                  >
                    {isTimedVideo && isActive ? (
                      <div
                        className="h-full bg-white transition-all duration-100 ease-linear"
                        style={{ width: `${videoProgress}%` }}
                      />
                    ) : (
                      <motion.div
                        key={`${activeStatusIndex}_${idx}`}
                        initial={{ width: isPast ? '100%' : '0%' }}
                        animate={{ width: isPast ? '100%' : isActive ? '100%' : '0%' }}
                        transition={
                          isActive
                            ? { duration: hasExtraContent ? 8 : 5, ease: 'linear' }
                            : { duration: 0 }
                        }
                        onAnimationComplete={() => {
                          if (isActive && !isTimedVideo) {
                            if (activeStatusIndex < statuses.length - 1) {
                              setActiveStatusIndex(activeStatusIndex + 1);
                              setVideoProgress(0);
                            } else {
                              setActiveStatusIndex(null);
                            }
                          }
                        }}
                        className="h-full bg-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Viewer Top Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50 pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 text-blue-700 font-bold shadow-sm">
                  A
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm drop-shadow">Admin</h3>
                  <p className="text-white/75 text-[11px] font-medium drop-shadow">
                    {statuses[activeStatusIndex]?.createdAt
                      ?.toDate?.()
                      ?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/45 text-white font-semibold text-xs backdrop-blur-md pointer-events-auto border border-white/15 tabular-nums">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>{viewCount !== null ? viewCount : '-'}</span>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(statuses[activeStatusIndex].id, e)}
                    className="min-w-[44px] min-h-[44px] rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center text-white transition-colors pointer-events-auto"
                    title="Remove status"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveStatusIndex(null)}
                  className="min-w-[44px] min-h-[44px] rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center text-white transition-colors pointer-events-auto"
                  title="Close status"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content & Navigation Areas */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {activeStatusIndex > 0 && (
                <div
                  className="absolute inset-y-24 left-0 w-1/5 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStatusIndex(activeStatusIndex - 1);
                    setVideoProgress(0);
                  }}
                />
              )}

              {statuses[activeStatusIndex].type === 'video' ? (
                <video
                  src={statuses[activeStatusIndex].imageUrl}
                  autoPlay
                  playsInline
                  controls
                  muted={false}
                  onTimeUpdate={(e) => {
                    const progress =
                      (e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100;
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
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              )}

              <div
                className="absolute inset-y-24 right-0 w-1/5 z-20 cursor-pointer"
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

            {/* Bottom Interactive Bar */}
            <div
              className="absolute bottom-4 left-4 right-4 z-40 flex flex-col gap-2.5 max-w-xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {statuses[activeStatusIndex].linkUrl && (
                <div className="flex justify-center">
                  <a
                    href={normalizeUrl(statuses[activeStatusIndex].linkUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg border border-white/25 active:scale-95 transition-all"
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
                      linkClassName:
                        'text-sky-300 hover:text-sky-200 underline font-extrabold break-all cursor-pointer',
                    })}
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-3 sm:gap-4 mb-0.5">
                {['❤️', '🔥', '👏', '🙌', '💯', '🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReply('reaction', emoji);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-2xl sm:text-3xl hover:scale-125 active:scale-95 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center bg-black/50 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
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
                  className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (replyText.trim()) handleReply('text', replyText);
                  }}
                  className="text-white font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
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
