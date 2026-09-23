import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ThumbsUp, ThumbsDown, MoreVertical, Trash, Edit, Check, Reply, MessageCircle, Loader2, ChevronLeft, Info, FileText, Image as ImageIcon  } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { getToxicWords } from '../lib/moderation';
import { ShieldAlert } from 'lucide-react';
import { cn, getFirstName } from '../lib/utils';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import UserProfileModal from './UserProfileModal';
import { createNotification } from '../lib/notifications';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  postId: string;
  createdAt: any;
  updatedAt?: any;
  parentId: string | null;
  imageUrl?: string;
  likesCount: number;
  likedBy: string[];
}

interface CommentsModalProps {
  post: any;
  author?: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentsModal({ post, author, isOpen, onClose }: CommentsModalProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendAsChulbul, setSendAsChulbul] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string, firstName: string, authorId?: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', post.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const fetchedComments = commentsData.sort((a: any, b: any) => {
         // Admin comments first
         if (a.isAdmin && !b.isAdmin) return -1;
         if (!a.isAdmin && b.isAdmin) return 1;
         // Then original author
         if (a.authorId === post.authorId && b.authorId !== post.authorId) return -1;
         if (a.authorId !== post.authorId && b.authorId === post.authorId) return 1;
         // Then by votes
         const aVotes = (a.upvotes || 0) - (a.downvotes || 0);
         const bVotes = (b.upvotes || 0) - (b.downvotes || 0);
         if (aVotes !== bVotes) return bVotes - aVotes;
         // Finally chronological
         const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
         const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
         return aDate.getTime() - bDate.getTime();
      });
      setComments(fetchedComments);
    });

    return () => {
      document.body.style.overflow = '';
      unsubscribe();
    };
  }, [isOpen, post.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && !imageFile) || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadFileToCloudinary(imageFile);
      }
      
      
      const toxicWordsFound = getToxicWords(newComment.trim());
      const isToxic = toxicWordsFound.length > 0;
      
      const newCommentData: any = {
        isToxic: isToxic,
        toxicWords: toxicWordsFound,
        text: newComment.trim(),
        authorId: sendAsChulbul ? 'inspector-chulbul-bot' : user.uid,
        postId: post.id,
        createdAt: serverTimestamp(),
        parentId: replyingTo ? replyingTo.id : null,
        likesCount: 0,
        likedBy: [],
      };
      
      if (imageUrl) {
        newCommentData.imageUrl = imageUrl;
      }
      
      const commentDocRef = await addDoc(collection(db, 'comments'), newCommentData);
      
      await updateDoc(doc(db, 'posts', post.id), {
        commentsCount: (post.commentsCount || 0) + 1
      });
      
      if (profile && user) {
        const notifySenderId = sendAsChulbul ? 'inspector-chulbul-bot' : user.uid;
        const notifySenderName = sendAsChulbul ? 'Inspector Chulbul 👮‍♂️' : (profile.fullName || 'User');
        const notifySenderAvatar = sendAsChulbul ? '/chulbul.png' : (profile.photoURL || '');

        if (replyingTo && replyingTo.authorId !== notifySenderId) {
          createNotification({
            recipientId: replyingTo.authorId || post.authorId,
            senderId: notifySenderId,
            senderName: notifySenderName,
            senderAvatar: notifySenderAvatar,
            type: 'reply',
            postId: post.id,
            commentId: replyingTo.id,
            commentContent: newCommentData.text
          });
        } else if (post.authorId !== notifySenderId) {
          createNotification({
            recipientId: post.authorId,
            senderId: notifySenderId,
            senderName: notifySenderName,
            senderAvatar: notifySenderAvatar,
            type: 'comment',
            postId: post.id,
            postContent: post.content,
            commentContent: newCommentData.text
          });
        }
      }
      
      

      setNewComment('');
      setSendAsChulbul(false);
      setImageFile(null);
      setReplyingTo(null);
      

      // Optional: scroll to top since sorting newest first
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Error adding comment:", error?.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Organize comments into threaded structure (1 level deep)
  const topLevelComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-[90vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Post Detail</h2>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content: Post Detail + Comments */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-800/50 flex flex-col" ref={scrollRef}>
          
          {/* Post Content */}
          <div className="bg-white dark:bg-slate-900 p-4 mb-2 shadow-sm border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                {author?.photoURL ? (
                  <img src={author.photoURL} alt={getFirstName(author.fullName)} className={`w-10 h-10 rounded-full object-cover shadow-sm ${author?.role === "admin" ? "border-[2px] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "border border-slate-100 dark:border-slate-800"}`} />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${author?.role === "admin" ? "bg-blue-100 text-blue-700 border-[2px] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-blue-100 text-blue-600 border border-slate-100 dark:border-slate-800"}`}>
                    {getFirstName(author?.fullName)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                {author?.role === "admin" && (
                  <div className="absolute -top-2 -right-2 flex items-center justify-center z-10" title="Admin">
                    <span className="text-[16px] leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">💎</span>
                  </div>
                )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{getFirstName(author?.fullName) || 'Loading...'}</h3>
                    {author?.role === 'admin' && (
                      <span className="text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm border border-cyan-400/50 uppercase tracking-wide">Admin</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{post.text}</p>

              {post.images && post.images.length > 0 && (
                <div className={cn("mt-4 grid gap-2", post.images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                  {post.images.map((img: string, i: number) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt="Post" 
                      className="w-full h-48 object-cover rounded-xl border border-slate-100 dark:border-slate-800" 
                    />
                  ))}
                </div>
              )}

              {post.pdfUrl && (
                <a 
                  href={post.pdfUrl.includes('.pdf') ? post.pdfUrl.replace('/upload/', '/upload/fl_attachment/') : post.pdfUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-4 flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-blue-900 truncate">Attached Document.pdf</div>
                  </div>
                </a>
              )}
            </div>
            
            <div className="flex items-center space-x-6 pt-3 border-t border-slate-50 mt-2">
              <div className="flex items-center space-x-4 shrink-0">
                <div className={cn("flex items-center space-x-1.5", user && post.likedBy?.includes(user.uid) ? "text-blue-600" : "text-slate-500 dark:text-slate-400")}>
                  <ThumbsUp className={cn("w-5 h-5", user && post.likedBy?.includes(user.uid) && "fill-current")} />
                  <span className="text-xs font-semibold">{post.likesCount || 0}</span>
                </div>
                <div className={cn("flex items-center space-x-1.5", user && post.dislikedBy?.includes(user.uid) ? "text-red-600" : "text-slate-500 dark:text-slate-400")}>
                  <ThumbsDown className={cn("w-5 h-5", user && post.dislikedBy?.includes(user.uid) && "fill-current")} />
                  <span className="text-xs font-semibold">{post.dislikesCount || 0}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-semibold">{comments.length} Comments</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Comments({comments.length})</h3>
            
            {/* Comments List */}
            {topLevelComments.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <MessageCircle className="w-12 h-12 stroke-[1.5]" />
                <p className="font-medium text-slate-500 dark:text-slate-400">No comments yet!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {topLevelComments.map(comment => (
                  <CommentThread 
                    key={comment.id}
                    comment={comment}
                    replies={replies
                      .filter(reply => reply.parentId === comment.id)
                      .sort((a, b) => {
                        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                        return aDate.getTime() - bDate.getTime();
                      })}
                    post={post}
                    onReply={(firstName, authorId) => setReplyingTo({ id: comment.id, firstName, authorId })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          {profile?.isBlocked ? (
            <div className="w-full py-3 bg-red-50 text-red-600 text-sm font-medium text-center rounded-xl border border-red-100">
              Your account is restricted from commenting.
            </div>
          ) : (
            <>
              {replyingTo && (
                <div className="flex items-center justify-between text-xs font-medium text-blue-600 mb-2 px-2 bg-blue-50 py-1.5 rounded-md w-fit">
                  <div className="flex items-center">
                    <Reply className="w-3.5 h-3.5 mr-1" />
                    Replying to {replyingTo.firstName}
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="ml-3 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {imageFile && (
                <div className="mb-2 relative inline-block">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => setImageFile(null)} 
                    className="absolute -top-2 -right-2 p-1 bg-slate-800 text-white rounded-full shadow-md hover:bg-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Add a comment (or attach image)..."}
                    className="w-full max-h-32 min-h-[44px] bg-transparent p-3 outline-none resize-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    rows={newComment.split('\n').length > 1 ? Math.min(newComment.split('\n').length, 4) : 1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <div className="px-3 pb-2 flex items-center justify-between">
                    {profile?.role === 'admin' && (
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200">
                        <input type="checkbox" checked={sendAsChulbul} onChange={(e) => setSendAsChulbul(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                        <ShieldAlert className="w-3 h-3" />
                        Send as Chulbul
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-300 rounded-lg transition-colors"
                      title="Attach Image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={imageInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                           setImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={(!newComment.trim() && !imageFile) || isSubmitting}
                  className="p-3.5 h-[44px] shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:bg-slate-700 disabled:text-slate-400 text-white rounded-xl transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
    </>
  );
}


interface CommentThreadProps {
  comment: Comment;
  replies: Comment[];
  post: any;
  onReply: (firstName: string, authorId?: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comment, replies, post, onReply }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayedReplies = showAll ? replies : replies.slice(0, 3);

  return (
    <div className="space-y-3">
      <CommentItem 
        comment={comment} 
        post={post}
        onReply={onReply}
      />
      
      {replies.length > 0 && !isExpanded && (
        <div className="pl-12">
          <button 
            onClick={() => setIsExpanded(true)}
            className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <div className="w-8 h-[1px] bg-blue-300 mr-2"></div>
            View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
        </div>
      )}

      {isExpanded && replies.length > 0 && (
        <div className="pl-12 space-y-3">
          {displayedReplies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              post={post}
              onReply={onReply}
            />
          ))}
          
          <div className="flex items-center space-x-4 pt-1">
            {!showAll && replies.length > 3 && (
              <button 
                onClick={() => setShowAll(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Show {replies.length - 3} more {replies.length - 3 === 1 ? 'reply' : 'replies'}
              </button>
            )}
            
            <button 
              onClick={() => {
                setIsExpanded(false);
                setShowAll(false);
              }}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-300"
            >
              Hide replies
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  post: any;
  onReply: (firstName: string, authorId?: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, post, onReply }) => {
  const { user } = useAuth();
  const [author, setAuthor] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null | undefined>(comment.imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const isAdmin = user?.email === 'aistoryimage1999@gmail.com';
  const isCommentOwner = user?.uid === comment.authorId;
  const isPostOwner = user?.uid === post.authorId;
  const canDelete = isCommentOwner || isPostOwner || isAdmin;
  const canEdit = isCommentOwner || isAdmin;
  
  const isLiked = user && comment.likedBy?.includes(user.uid);
  if (comment.isDeleted && isCommentOwner) return null;

  useEffect(() => {
    const fetchAuthor = async () => {
      const docRef = doc(db, 'users', comment.authorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAuthor(docSnap.data());
      }
    };
    fetchAuthor();
  }, [comment.authorId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
    if (!user) return;
    const commentRef = doc(db, 'comments', comment.id);
    if (isLiked) {
      await updateDoc(commentRef, {
        likedBy: arrayRemove(user.uid),
        likesCount: Math.max(0, (comment.likesCount || 0) - 1)
      });
    } else {
      await updateDoc(commentRef, {
        likedBy: arrayUnion(user.uid),
        likesCount: (comment.likesCount || 0) + 1
      });
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      await updateDoc(doc(db, 'comments', comment.id), { isDeleted: true });
      await updateDoc(doc(db, 'posts', post.id), {
        commentsCount: Math.max(0, (post.commentsCount || 0) - 1)
      });
    } catch (error) {
      console.error("Error deleting comment:", error?.message || 'Error');
    }
  };

  const handleSaveEdit = async () => {
    if (!canEdit || !editedText.trim() || (editedText === comment.text && editedImageUrl === comment.imageUrl)) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const updates: any = {
        text: editedText.trim(),
        updatedAt: serverTimestamp()
      };
      if (editedImageUrl !== comment.imageUrl) {
        updates.imageUrl = editedImageUrl || null;
      }
      await updateDoc(doc(db, 'comments', comment.id), updates);
      setIsEditing(false);
      // update local comment state since we are no longer using onSnapshot
      comment.imageUrl = editedImageUrl;
      comment.text = editedText.trim();
    } catch (error) {
      console.error("Error editing comment:", error?.message || 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  
  if (comment.authorId === 'inspector-chulbul-bot') {
    return (
     <div className="flex flex-col w-full my-6">
       <div className="flex items-start gap-3 md:gap-4 group relative w-full px-2">
         <div className="w-16 md:w-20 shrink-0 relative z-20 animate-[bounce_2s_ease-in-out_infinite]">
           <img src="/chulbul.png" alt="Chulbul" className="w-full h-auto object-contain drop-shadow-xl" />
         </div>
         <div className="bg-white border-2 border-red-500 text-red-900 px-4 py-3 rounded-2xl shadow-xl z-10 flex-1 relative animate-[pulse_3s_ease-in-out_infinite] mt-1 md:mt-2">
           <div className="absolute -left-[9px] top-4 w-4 h-4 bg-white border-l-2 border-b-2 border-red-500 transform rotate-45 rounded-bl-sm z-10"></div>
           <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span className="font-black text-red-700 block text-sm uppercase tracking-wider">Inspector Chulbul 👮‍♂️</span>
           </div>
           {comment.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all text-[13px] font-bold text-slate-800" style={{ wordBreak: 'break-word' }}>{comment.text}</div>}
           <div className="flex justify-end mt-2">
             <button onClick={() => {if(canDelete) handleDelete();}} className="text-red-400 hover:text-red-600 text-xs flex items-center"><Trash className="w-3 h-3 mr-1"/> Delete</button>
           </div>
         </div>
       </div>
     </div>
    );
  }

  return (
    <div className="flex space-x-3">
      <button onClick={() => setShowProfileModal(true)} className="shrink-0 focus:outline-none transition-transform hover:scale-105 active:scale-95 relative">
        {author?.photoURL ? (
          <img src={author.photoURL} alt={getFirstName(author.fullName)} className={`w-8 h-8 rounded-full object-cover ${author?.role === "admin" ? "border-[2px] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : ""}`} />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${author?.role === "admin" ? "bg-blue-100 text-blue-700 border-[2px] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-blue-100 text-blue-700 border border-blue-200"}`}>
            {getFirstName(author?.fullName)?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className={"p-3 rounded-2xl rounded-tl-none shadow-sm border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}>
          <div className="flex items-center justify-between mb-1">
            {comment.isDeleted && <div className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit border border-red-100"><ShieldAlert className="w-3 h-3" />This comment was deleted by sender</div>}
            <div className="flex items-center space-x-2 min-w-0">
              <button onClick={() => setShowProfileModal(true)} className="text-sm font-bold text-slate-900 dark:text-white truncate hover:underline focus:outline-none text-left">{getFirstName(author?.fullName) || 'Loading...'}</button>
              {author?.role === 'admin' && (
                <span className="text-[9px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm border border-cyan-400/50 uppercase tracking-wide shrink-0">Admin</span>
              )}
            </div>
            
            {/* Menu */}
            {(isCommentOwner || canDelete) && (
              <div className="relative shrink-0 ml-2" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)} 
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-lg py-1 border border-slate-100 dark:border-slate-800 z-10">
                    {canEdit && (
                      <button 
                        onClick={() => { setEditedText(comment.text); setEditedImageUrl(comment.imageUrl); setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                      >
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => { handleDelete(); setShowMenu(false); }} 
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm bg-blue-50/50"
                rows={2}
                autoFocus
              />
              {editedImageUrl && (
                <div className="relative inline-block rounded-xl overflow-hidden mt-2">
                  <img src={editedImageUrl} alt="Attachment" className="w-24 h-24 object-cover" />
                  <button
                    onClick={() => setEditedImageUrl(null)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => { setEditedText(comment.text); setEditedImageUrl(comment.imageUrl); setIsEditing(false); }}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editedText.trim() || (editedText === comment.text && editedImageUrl === comment.imageUrl)}
                  className="px-3 py-1 flex items-center text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div><p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{comment.text}</p>
            {comment.imageUrl && (
              <div 
                className="mt-2 relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 max-w-[200px] cursor-pointer"
                onClick={() => setSelectedImage(comment.imageUrl || null)}
              >
                <img src={comment.imageUrl} alt="Comment attachment" className="w-full h-auto max-h-32 object-contain" />
              </div>
            )}</div>
          )}
        </div>
        
        {/* Action Row */}
        <div className="flex items-center space-x-4 mt-1.5 ml-2">
          <span className="text-[11px] text-slate-400 font-medium">
            {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
            {comment.updatedAt && ' (edited)'}
          </span>
          <button 
            onClick={handleLike}
            className={cn("flex items-center space-x-1 text-[11px] font-semibold transition-colors", isLiked ? "text-blue-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-300")}
          >
            <ThumbsUp className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
            {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
          </button>
            <button 
              onClick={() => onReply(getFirstName(author?.fullName) || 'user', comment.authorId)}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-300 transition-colors"
            >
              Reply
            </button>
        </div>
      </div>
      {showProfileModal && author && (
        <UserProfileModal user={author} onClose={() => setShowProfileModal(false)} />
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in duration-200" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
