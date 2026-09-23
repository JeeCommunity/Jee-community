import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, limit, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { cn, playNotificationSound } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { requestNotificationPermission } from '../lib/fcm';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function NotificationsDropdown() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const notifs: any[] = [];
      let unread = 0;
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        notifs.push({ id: doc.id, ...data });
        if (!data.isRead) {
          unread++;
        }
      });
      
      setNotifications(notifs);
      setUnreadCount(unread);
    }, (err) => {
      console.error("Error fetching notifications", err);
    });
    
    return () => unsub();
  }, [user]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), {
          isRead: true
        });
      } catch (error) {
        console.error("Error marking as read", error?.message || 'Error');
      }
    }
    
    setIsOpen(false);
    
    if (notif.type === 'live_study') {
      navigate('/study-room');
    } else if (notif.type === 'note_upload') {
      navigate('/notes-hub');
    } else if (notif.type === 'like' || notif.type === 'comment' || notif.type === 'reply') {
      if (notif.postId) {
        navigate(`/community?postId=${notif.postId}`);
      } else {
        navigate('/community');
      }
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(
        notifications.map(n => 
          deleteDoc(doc(db, 'notifications', n.id))
        )
      );
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing all", error?.message || 'Error');
    }
  };

  const handleToggleCheers = async () => {
    if (!user) return;
    try {
      const newVal = profile?.cheersEnabled === false ? true : false;
      await updateDoc(doc(db, 'users', user.uid), {
        cheersEnabled: newVal
      });
      toast.success(newVal ? "Cheers enabled!" : "Cheers disabled");
    } catch (e: any) {
      console.error(e?.message || 'Error');
      toast.error("Failed to update settings");
    }
  };

  const handleEnablePush = async () => {
    if (user) {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setPushEnabled(true);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="fixed top-14 inset-x-4 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-xs text-blue-600 font-medium hover:text-blue-700"
                >
                  Clear all
                </button>
              )}
</div>
            
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Allow Cheers (🔥/👏)</span>
              <button
                onClick={handleToggleCheers}
                className={cn(
                  "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                  profile?.cheersEnabled !== false ? "bg-blue-500" : "bg-slate-300"
                )}
              >
                <span className={cn(
                  "inline-block h-3 w-3 transform rounded-full bg-white dark:bg-slate-900 transition-transform",
                  profile?.cheersEnabled !== false ? "translate-x-3.5" : "translate-x-0.5"
                )} />
              </button>
            </div>
            
            {!pushEnabled && Notification.permission !== 'denied' && (
              <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-start justify-between">
                <div className="text-xs text-blue-800 mr-2 flex-1">
                  <strong>Enable Push Notifications</strong> to stay updated on study sessions and replies!
                </div>
                <button 
                  onClick={handleEnablePush}
                  className="shrink-0 bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  title="Enable Push Notifications"
                >
                  <BellRing className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="overflow-y-auto flex-1 p-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "p-3 rounded-lg text-sm transition-colors cursor-pointer flex items-start space-x-3",
                        notif.isRead ? "hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 bg-white dark:bg-slate-900" : "bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50"
                      )}
                    >
                      <img 
                        src={notif.senderAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${notif.senderName}`} 
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-slate-200">
                          <span className="font-semibold">{notif.senderName}</span>
                          {' '}
                          {notif.type === 'like' && 'liked your post. ⭐'}
                          {notif.type === 'comment' && 'commented on your post. 💬'}
                          {notif.type === 'reply' && 'replied to your comment. 💬'}
                          {notif.type === 'live_study' && 'is in the zone! 🔥 Join the Live Study Room!'}
                          {notif.type === 'note_upload' && 'dropped some new knowledge. 📚'}
                          {notif.type === 'cheer_fire' && 'cheered for your focus! 🔥'}
                          {notif.type === 'cheer_clap' && 'cheered for your focus! 👏'}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5 text-xs">
                          {notif.type === 'like' && notif.postContent}
                          {(notif.type === 'comment' || notif.type === 'reply') && notif.commentContent}
                          {notif.type === 'note_upload' && (
                            <span className="italic">"{notif.noteTitle}"</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
