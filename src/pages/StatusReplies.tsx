import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Video, Image as ImageIcon, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function StatusReplies() {
  const { user, profile } = useAuth();
  const [replies, setReplies] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  
  const isAdmin = user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    
    const q = query(collection(db, 'status_replies'), orderBy('createdAt', 'desc'), limit(50));
    const fetchReplies = async () => {
      const q = query(collection(db, 'status_replies'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setReplies(data);
      
      // Fetch statuses that are referenced
      const statusIds = [...new Set(data.map(r => r.statusId))];
      const statusData: Record<string, any> = {};
      
      for (const id of statusIds) {
        if (!statuses[id]) {
          try {
            const s = await getDoc(doc(db, 'admin_statuses', id));
            if (s.exists()) {
              statusData[id] = s.data();
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      
      if (Object.keys(statusData).length > 0) {
         setStatuses(prev => ({...prev, ...statusData}));
      }
    };
    
    fetchReplies();
  }, [isAdmin]);

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteDoc(doc(db, 'status_replies', replyId));
      setReplies(prev => prev.filter(r => r.id !== replyId));
      toast.success("Reply deleted");
    } catch (e) {
      console.error("Error deleting reply:", e);
      alert("Failed to delete reply");
    }
  };

  if (!isAdmin) {
    return <div className="p-4 text-center">You do not have permission to view this page.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 p-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-blue-500" />
        Status Replies
      </h1>
      
      <div className="flex flex-col gap-4">
        {replies.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
            No replies yet.
          </div>
        ) : (
          replies.map(reply => (
            <motion.div 
              key={reply.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4"
            >
              <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {statuses[reply.statusId] ? (
                  statuses[reply.statusId].type === 'video' ? (
                    <video src={statuses[reply.statusId].imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={statuses[reply.statusId].imageUrl} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    Deleted
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 relative">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{reply.senderName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {reply.createdAt?.toDate ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </span>
                    <button 
                      onClick={() => handleDeleteReply(reply.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="Delete reply"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {reply.type === 'reaction' ? (
                    <span className="text-2xl">{reply.content}</span>
                  ) : (
                    <p className="text-sm break-words whitespace-pre-wrap min-w-0">{reply.content}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
