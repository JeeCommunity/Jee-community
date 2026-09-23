import React from "react";
import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ExternalLink, ThumbsDown, MessageCircle, Bookmark, MoreVertical, FileText, Trash, Edit, X, ChevronLeft, Check, AlertCircle, Sparkles, BarChart2, CheckCircle2, Pin, PinOff, ShieldAlert  } from 'lucide-react';
import { doc, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { cn, getFirstName } from '../lib/utils';
import { safeStringify } from '../lib/safeStringify';
import CommentsModal from './CommentsModal';
import AISolverModal from './AISolverModal';
import UserProfileModal from './UserProfileModal';

import { createNotification } from '../lib/notifications';

interface PostCardProps {
  post: any;
  onDelete?: (id: string) => void;
  initialShowComments?: boolean;
}

export default function PostCard({ post, onDelete, initialShowComments = false }: PostCardProps) {
  const { user, profile } = useAuth();
  const [author, setAuthor] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const [showComments, setShowComments] = useState(initialShowComments);
  const postRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (initialShowComments) {
      setShowComments(true);
      setTimeout(() => {
        postRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [initialShowComments]);

  const [localIsLiked, setLocalIsLiked] = useState(user && post.likedBy?.includes(user.uid));
  const [localIsDisliked, setLocalIsDisliked] = useState(user && post.dislikedBy?.includes(user.uid));
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount || 0);
  const [localDislikesCount, setLocalDislikesCount] = useState(post.dislikesCount || 0);
  
  useEffect(() => {
    setLocalIsLiked(user && post.likedBy?.includes(user.uid));
    setLocalIsDisliked(user && post.dislikedBy?.includes(user.uid));
    setLocalLikesCount(post.likesCount || 0);
    setLocalDislikesCount(post.dislikesCount || 0);
  }, [post, user]);


  
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const handleReport = async () => {
    if (!user) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        reportCount: increment(1),
        reportedBy: arrayUnion(user.uid),
        reports: arrayUnion({ userId: user.uid, reason: reportReason, date: new Date().toISOString() })
      });
      setShowReportConfirm(false);
      alert('Post reported to admins.');
    } catch (error) {
      console.error('Error reporting post', error?.message || 'Error');
    }
  };
const handleVote = async (optionId: string) => {
    if (!user || isVoting || !post.poll) return;
    setIsVoting(true);
    try {
      const postRef = doc(db, 'posts', post.id);
      
      // Calculate new poll data
      const currentVoters = post.poll.voters || {};
      const currentOptions = post.poll.options || [];
      const previousVoteId = currentVoters[user.uid];
      
      const newVoters = { ...currentVoters, [user.uid]: optionId };
      const newOptions = currentOptions.map((opt: any) => {
        let votes = opt.votes || 0;
        if (opt.id === previousVoteId) votes = Math.max(0, votes - 1);
        if (opt.id === optionId) votes++;
        return { ...opt, votes };
      });
      
      await updateDoc(postRef, {
        'poll.voters': newVoters,
        'poll.options': newOptions
      });
    } catch (error) {
      console.error('Failed to vote:', error?.message || 'Error');
    } finally {
      setIsVoting(false);
    }
  };


  const togglePin = async () => {
    if (!isAdmin) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { isPinned: !post.isPinned });
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to pin post", err?.message || 'Error');
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const postRef = doc(db, 'posts', post.id);
    const authorRef = doc(db, 'users', post.authorId);
    
    // Optimistic Update
    if (localIsLiked) {
      setLocalIsLiked(false);
      setLocalLikesCount(Math.max(0, localLikesCount - 1));
      await updateDoc(postRef, {
        likedBy: arrayRemove(user.uid),
        likesCount: Math.max(0, localLikesCount - 1)
      });
    } else {
      setLocalIsLiked(true);
      setLocalLikesCount(localLikesCount + 1);
      
      const updates: any = {
        likedBy: arrayUnion(user.uid),
        likesCount: localLikesCount + 1
      };
      
      if (localIsDisliked) {
        setLocalIsDisliked(false);
        setLocalDislikesCount(Math.max(0, localDislikesCount - 1));
        updates.dislikedBy = arrayRemove(user.uid);
        updates.dislikesCount = Math.max(0, localDislikesCount - 1);
      }
      
      await updateDoc(postRef, updates);
      if (post.authorId !== user.uid) {
         createNotification({
            recipientId: post.authorId,
            senderId: user.uid,
            senderName: profile?.fullName || profile?.username || "Unknown",
            senderAvatar: profile?.photoURL || "",
            type: 'like',
            postId: post.id,
            postContent: post.content?.substring(0, 50) || "Image post"
         });
      }
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    const postRef = doc(db, 'posts', post.id);
    
    if (localIsDisliked) {
      setLocalIsDisliked(false);
      setLocalDislikesCount(Math.max(0, localDislikesCount - 1));
      await updateDoc(postRef, {
        dislikedBy: arrayRemove(user.uid),
        dislikesCount: Math.max(0, localDislikesCount - 1)
      });
    } else {
      setLocalIsDisliked(true);
      setLocalDislikesCount(localDislikesCount + 1);
      const updates: any = {
        dislikedBy: arrayUnion(user.uid),
        dislikesCount: localDislikesCount + 1
      };
      if (localIsLiked) {
        setLocalIsLiked(false);
        setLocalLikesCount(Math.max(0, localLikesCount - 1));
        updates.likedBy = arrayRemove(user.uid);
        updates.likesCount = Math.max(0, localLikesCount - 1);
      }
      await updateDoc(postRef, updates);
    }
  };

  const [isBookmarked, setIsBookmarked] = useState(false); // mock for now
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showAI, setShowAI] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Only count view if not already viewed by this user locally
    const viewedPosts = JSON.parse(localStorage.getItem('viewedPosts') || '{}');
    
    if (!viewedPosts[post.id]) {
      const timer = setTimeout(async () => {
        try {
           const postRef = doc(db, 'posts', post.id);
           await updateDoc(postRef, {
             viewsCount: increment(1)
           });
           viewedPosts[post.id] = true;
           localStorage.setItem('viewedPosts', safeStringify(viewedPosts));
        } catch (e) {
           console.error("Failed to update views", e?.message || 'Error');
        }
      }, 3000); // 3 seconds in view to count

      return () => clearTimeout(timer);
    }
  }, [post.id]);

  const [editedText, setEditedText] = useState(post.text);
  const [editedImages, setEditedImages] = useState<string[]>(post.images || []);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(post.pdfUrl || null);
  
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';
  const isOwner = user?.uid === post.authorId || isAdmin;

  const uploadFileToCloudinaryLocal = async (file: File): Promise<string> => {
    const { uploadFileToCloudinary } = await import('../lib/cloudinary');
    return uploadFileToCloudinary(file);
  };

  useEffect(() => {
    const fetchAuthor = async () => {
      const docRef = doc(db, 'users', post.authorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAuthor(docSnap.data());
      }
    };
    fetchAuthor();
  }, [post.authorId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!isOwner) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      setShowDeleteConfirm(false);
      onDelete?.(post.id);
    } catch (err) {
      console.error("Failed to delete", err?.message || 'Error');
    }
  };

  const handleSaveEdit = async () => {
    if (!isOwner || (!editedText.trim() && editedImages.length === 0 && !editedPdfUrl && newImageFiles.length === 0 && !newPdfFile)) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      let finalImages = [...editedImages];
      let finalPdfUrl = editedPdfUrl;
      
      if (newImageFiles.length > 0) {
        for (const file of newImageFiles) {
          const url = await uploadFileToCloudinaryLocal(file);
          finalImages.push(url);
        }
      }
      
      if (newPdfFile) {
        finalPdfUrl = await uploadFileToCloudinaryLocal(newPdfFile);
      }

      await updateDoc(doc(db, 'posts', post.id), {
        text: editedText.trim(),
        images: finalImages,
        pdfUrl: finalPdfUrl
      });
      setIsEditing(false);
      setNewImageFiles([]);
      setNewPdfFile(null);
      
      // Update local state for immediate feedback
      post.text = editedText.trim();
      post.images = finalImages;
      post.pdfUrl = finalPdfUrl;

    } catch (err: any) {
      console.error("Failed to edit post", err?.message || 'Error');
      setError(err.message || 'Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditedText(post.text);
    setEditedImages(post.images || []);
    setEditedPdfUrl(post.pdfUrl || null);
    setNewImageFiles([]);
    setNewPdfFile(null);
    setError('');
    setIsEditing(false);
  };

  return (
    <>
      <article ref={postRef} className={cn(
        "px-4 pt-4 pb-1 transition-colors relative",
        post.isPinned 
          ? "bg-indigo-50/30 border-y-2 border-indigo-200" 
          : "bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700"
      )}>
        {post.isPinned && (
          <div className="absolute -top-2.5 right-6 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center shadow-sm z-10 uppercase tracking-widest border-2 border-white">
            <Sparkles className="w-3 h-3 mr-1 text-indigo-200" /> Important
          </div>
        )}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowProfileModal(true)} className="shrink-0 focus:outline-none transition-transform hover:scale-105 active:scale-95 relative">
              {author?.photoURL ? (
                <img src={author.photoURL} alt={getFirstName(author.fullName)} className={`w-10 h-10 rounded-full object-cover ${author?.role === "admin" ? "border-[2px] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "border border-slate-200 dark:border-slate-700"}`} />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${author?.role === "admin" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-[2px] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}>
                  {getFirstName(author?.fullName)?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              {author?.role === "admin" && (
                <div className="absolute -top-2 -right-2 flex items-center justify-center z-10" title="Admin">
                  <span className="text-[16px] leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">💎</span>
                </div>
              )}
            </button>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <button onClick={() => setShowProfileModal(true)} className="text-[15px] font-bold text-slate-900 dark:text-white hover:underline focus:outline-none text-left">{getFirstName(author?.fullName) || 'Loading...'}</button>
                {author?.role === 'admin' && (
                  <span className="text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm border border-cyan-400/50 uppercase tracking-wide">Admin</span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }).replace('about ', '') : 'just now'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors p-1">
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-lg py-1 border border-slate-100 dark:border-slate-800 z-10">
                    {isOwner && (
                      <button 
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button 
                         onClick={togglePin} 
                         className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                      >
                        {post.isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                        {post.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                    {(isOwner || isAdmin) && (
                      <button 
                        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    )}
                    {!isOwner && !post.reportedBy?.includes(user.uid) && (
                      <button 
                        onClick={() => { setShowReportConfirm(true); setShowMenu(false); }} 
                        className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Report
                      </button>
                    )}
                    {!isOwner && post.reportedBy?.includes(user.uid) && (
                      <button 
                        disabled
                        className="w-full text-left px-4 py-2 text-sm text-slate-400 flex items-center"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Reported
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center text-red-800 text-sm font-medium">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              Delete this post?
            </div>
            <div className="flex space-x-2 shrink-0">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg">Delete</button>
            </div>
          </div>
        )}

        <div className="mb-2">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-3 border border-blue-200 dark:border-blue-800/30 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm bg-blue-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                rows={3}
                autoFocus
              />
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  {editedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editedImages.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden">
                          <img src={url} alt="Attachment" className="w-24 h-24 object-cover" />
                          <button
                            onClick={() => setEditedImages(editedImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {newImageFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newImageFiles.map((file, idx) => (
                        <div key={idx} className="relative inline-block rounded-xl overflow-hidden">
                          <img src={URL.createObjectURL(file)} alt="New attachment" className="w-24 h-24 object-cover opacity-70" />
                          <button
                            onClick={() => setNewImageFiles(newImageFiles.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*" multiple
                    ref={imageInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
                        if (validFiles.length < files.length) {
                          setError('Some images were skipped because they exceed 5MB');
                        }
                        const allowedRemaining = 3 - editedImages.length;
                        setNewImageFiles(validFiles.slice(0, allowedRemaining));
                      }
                    }}
                  />
                  {editedPdfUrl && (
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg w-fit mt-2">
                      <FileText className="w-5 h-5 text-red-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Existing PDF Attachment</span>
                      <button
                        type="button"
                        onClick={() => setEditedPdfUrl(null)}
                        className="p-1 hover:bg-slate-200 dark:bg-slate-700 rounded-full transition-colors ml-2"
                      >
                        <X className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-600" />
                      </button>
                    </div>
                  )}
                  {newPdfFile && (
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg w-fit mt-2">
                      <FileText className="w-5 h-5 text-red-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{newPdfFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setNewPdfFile(null)}
                        className="p-1 hover:bg-slate-200 dark:bg-slate-700 rounded-full transition-colors ml-2"
                      >
                        <X className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-600" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    ref={pdfInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewPdfFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    {(editedImages.length + newImageFiles.length) < 3 && (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-200 dark:bg-slate-700 font-medium"
                      >
                        Add Image
                      </button>
                    )}
                    {!editedPdfUrl && !newPdfFile && (
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-200 dark:bg-slate-700 font-medium"
                      >
                        Add PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button onClick={cancelEdit} className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" disabled={isSaving}>Cancel</button>
                <button onClick={handleSaveEdit} className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{post.text}</p>
              
              {post.isToxic && post.toxicWords && post.toxicWords.length > 0 && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl p-3">
                   <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-red-700 dark:text-red-400">Content Warning</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-red-600 dark:text-red-400">Flagged Words:</span>
                      {post.toxicWords.map((word: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-bold">
                          {word}
                        </span>
                      ))}
                   </div>
                </div>
              )}
              
              {post.images && post.images.length > 0 && (
                <div className="mt-3 relative w-full h-80 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group" onClick={() => setSelectedImageIndex(0)}>
                  <img src={post.images[0]} alt="Post attachment" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  {post.images.length > 1 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                        +{post.images.length - 1} more
                      </span>
                    </div>
                  )}
                  {post.images.length > 1 && (
                     <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                       1 / {post.images.length}
                     </div>
                  )}
                </div>
              )}
              {post.pdfUrl && (
                <div className="mt-3 flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">PDF Attachment</p>
                  </div>
                  <a 
                    href={post.pdfUrl.includes('.pdf') ? post.pdfUrl.replace('/upload/', '/upload/fl_attachment/') : post.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700"
                  >
                    Open <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              )}
              {post.poll && (
                <div className="mt-4 space-y-2">
                  {post.poll.options.map((option: any) => {
                    const totalVotes = Object.keys(post.poll.voters || {}).length;
                    const percentage = totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0;
                    const hasVotedForThis = user && post.poll.voters?.[user.uid] === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        disabled={!user || isVoting}
                        className={`relative w-full overflow-hidden text-left p-3 rounded-xl border transition-all ${hasVotedForThis ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                      >
                        <div 
                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${hasVotedForThis ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="relative flex justify-between items-center z-10">
                          <span className={`font-medium text-sm ${hasVotedForThis ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {option.text}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {percentage}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-right mt-1">
                    {Object.keys(post.poll.voters || {}).length} votes
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end mb-1">
          <div className="flex items-center text-slate-400 space-x-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span className="text-[11px] font-semibold">{post.viewsCount || 0} views</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto scrollbar-hide gap-4 pb-1">
          <div className="flex items-center space-x-4 shrink-0">
            <button onClick={handleLike} className={cn("flex items-center space-x-1.5 transition-colors", localIsLiked ? "text-blue-600" : "text-slate-500 dark:text-slate-400 hover:text-blue-600")}>
              <ThumbsUp className={cn("w-5 h-5", localIsLiked && "fill-current")} />
              <span className="text-xs font-semibold">{localLikesCount}</span>
            </button>
            <button onClick={handleDislike} className={cn("flex items-center space-x-1.5 transition-colors", localIsDisliked ? "text-red-600" : "text-slate-500 dark:text-slate-400 hover:text-red-600")}>
              <ThumbsDown className={cn("w-5 h-5", localIsDisliked && "fill-current")} />
              <span className="text-xs font-semibold">{localDislikesCount}</span>
            </button>
          </div>
          
          <button 
            onClick={() => setShowComments(true)}
            className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors shrink-0"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-semibold">Comment ({post.commentsCount || 0})</span>
          </button>
          
          <button 
             onClick={() => setShowAI(true)}
            className="flex items-center space-x-1.5 text-indigo-500 hover:text-indigo-600 transition-colors shrink-0"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-semibold">AI Solve</span>
          </button>

          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn("transition-colors shrink-0 ml-auto", isBookmarked ? "text-blue-600" : "text-slate-500 dark:text-slate-400 hover:text-blue-600")}
          >
            <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
          </button>
        </div>
      </article>

            {showReportConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Report Post</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Please select a reason for reporting this post.</p>
            <select 
              value={reportReason} 
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Select a reason...</option>
              <option value="spam">Spam or misleading</option>
              <option value="harassment">Harassment or hate speech</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="irrelevant">Not relevant to JEE</option>
            </select>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowReportConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReport}
                disabled={!reportReason}
                className="flex-1 py-2.5 rounded-xl font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <CommentsModal 
        post={post}
        author={author}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
      <AISolverModal
        post={post}
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />
      
      {selectedImageIndex !== null && post.images && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          
          {selectedImageIndex > 0 && (
             <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-full transition-colors z-10"
                onClick={(e) => {
                   e.stopPropagation();
                   setSelectedImageIndex(selectedImageIndex - 1);
                }}
             >
                <ChevronLeft className="w-8 h-8" />
             </button>
          )}

          <img 
            src={post.images[selectedImageIndex]} 
            alt="Expanded view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          />
          
          {selectedImageIndex < post.images.length - 1 && (
             <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-full transition-colors z-10 transform rotate-180"
                onClick={(e) => {
                   e.stopPropagation();
                   setSelectedImageIndex(selectedImageIndex + 1);
                }}
             >
                <ChevronLeft className="w-8 h-8" />
             </button>
          )}
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm font-bold backdrop-blur-md">
             {selectedImageIndex + 1} / {post.images.length}
          </div>
        </div>
      )}
      {showProfileModal && author && (
        <UserProfileModal user={author} onClose={() => setShowProfileModal(false)} />
      )}
    </>
  );
}
