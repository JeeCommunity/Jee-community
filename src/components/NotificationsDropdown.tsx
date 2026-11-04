import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { cn, playNotificationSound } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { requestNotificationPermission } from '../lib/fcm';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { renderTextWithLinks } from '../lib/linkify';
import {
  subscribeSupabaseNotifications,
  markNotificationReadLocal,
  clearAllNotificationsForUser,
} from '../lib/supabaseHub';

export default function NotificationsDropdown() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = subscribeSupabaseNotifications(user.uid, (notifs, newArrival) => {
      setNotifications(notifs);
      const unread = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(unread);

      if (newArrival) {
        try {
          playNotificationSound();
        } catch {
          // ignore audio restriction
        }
        let toastMsg = `${newArrival.senderName} sent an update`;
        if (newArrival.type === 'edutube_video') {
          toastMsg = `🎬 ${newArrival.senderName} uploaded a new ${
            newArrival.videoType === 'short' ? 'Short' : 'Video'
          }: "${newArrival.videoTitle || 'Watch now'}"`;
        } else if (newArrival.type === 'new_post') {
          toastMsg = `📝 ${newArrival.senderName} posted in Community: "${
            newArrival.postContent || 'View post'
          }"`;
        } else if (newArrival.type === 'note_upload') {
          toastMsg = `📚 ${newArrival.senderName} uploaded in Notes Hub: "${
            newArrival.noteTitle || 'New study material'
          }"`;
        } else if (newArrival.type === 'cheer_fire' || newArrival.type === 'cheer_clap') {
          toastMsg = `🔥 ${newArrival.senderName} cheered for your study session!`;
        } else if (newArrival.type === 'comment' || newArrival.type === 'reply') {
          toastMsg = `💬 ${newArrival.senderName}: "${newArrival.commentContent || 'New comment'}"`;
        }
        toast(toastMsg, { duration: 4500 });
      }
    });

    return () => unsub();
  }, [user?.uid]);

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markNotificationReadLocal(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsOpen(false);

    if (
      notif.type === 'edutube_video' ||
      notif.type === 'edutube_launch' ||
      notif.type === 'edutube_like' ||
      notif.type === 'edutube_comment' ||
      notif.type === 'edutube_subscribe' ||
      notif.type === 'admin_broadcast'
    ) {
      navigate(notif.targetUrl || '/edutube');
    } else if (
      notif.type === 'live_study' ||
      notif.type === 'cheer_fire' ||
      notif.type === 'cheer_clap'
    ) {
      navigate('/study-room');
    } else if (notif.type === 'note_upload') {
      navigate('/notes');
    } else if (
      notif.type === 'new_post' ||
      notif.type === 'like' ||
      notif.type === 'comment' ||
      notif.type === 'reply'
    ) {
      if (notif.postId) {
        navigate(`/community?postId=${notif.postId}`);
      } else {
        navigate('/community');
      }
    } else if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const handleClearAll = () => {
    const ids = notifications.map((n) => n.id).filter(Boolean);
    clearAllNotificationsForUser(ids);
    setNotifications([]);
    setUnreadCount(0);
    toast.success('Notifications cleared');
  };

  const handleToggleCheers = async () => {
    if (!user) return;
    try {
      const newVal = profile?.cheersEnabled === false ? true : false;
      await updateDoc(doc(db, 'users', user.uid), {
        cheersEnabled: newVal,
      });
      toast.success(newVal ? 'Cheers enabled!' : 'Cheers disabled');
    } catch (e: any) {
      console.error(e?.message || 'Error');
      toast.error('Failed to update settings');
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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="fixed top-14 inset-x-4 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  LIVE
                </span>
              </div>
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
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Allow Cheers (🔥/👏)
              </span>
              <button
                onClick={handleToggleCheers}
                className={cn(
                  'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                  profile?.cheersEnabled !== false ? 'bg-blue-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3 w-3 transform rounded-full bg-white dark:bg-slate-900 transition-transform',
                    profile?.cheersEnabled !== false ? 'translate-x-3.5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {!pushEnabled &&
              typeof Notification !== 'undefined' &&
              Notification.permission !== 'denied' && (
                <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-start justify-between">
                  <div className="text-xs text-blue-800 mr-2 flex-1">
                    <strong>Enable Push Notifications</strong> to stay updated on new videos, posts,
                    notes &amp; study sessions!
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

            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  No new notifications
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        'p-3 rounded-lg text-sm transition-colors cursor-pointer flex items-start space-x-3',
                        notif.isRead
                          ? 'hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
                          : 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40'
                      )}
                    >
                      <img
                        src={
                          notif.senderAvatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            notif.senderName || 'User'
                          )}`
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-slate-200 text-xs leading-snug">
                          <span className="font-semibold">{notif.senderName}</span>{' '}
                          {notif.type === 'edutube_video' &&
                            `uploaded a new ${
                              notif.videoType === 'short' ? 'Short ⚡' : 'Video 🎬'
                            } on EduTube!`}
                          {notif.type === 'new_post' && 'posted a new update in Community! 📝'}
                          {notif.type === 'note_upload' &&
                            'uploaded new study material in Notes Hub! 📚'}
                          {notif.type === 'like' && 'liked your post. ⭐'}
                          {notif.type === 'comment' && 'commented on your post. 💬'}
                          {notif.type === 'reply' && 'replied to your comment. 💬'}
                          {notif.type === 'edutube_like' && 'liked your video on EduTube! 👍'}
                          {notif.type === 'edutube_comment' &&
                            'commented on your EduTube video! 💬'}
                          {notif.type === 'edutube_subscribe' &&
                            'subscribed to your EduTube channel! 🔔'}
                          {notif.type === 'live_study' &&
                            'is in the zone! 🔥 Join the Live Study Room!'}
                          {notif.type === 'cheer_fire' && 'cheered for your focus! 🔥'}
                          {notif.type === 'cheer_clap' && 'cheered for your focus! 👏'}
                          {(notif.type === 'admin_broadcast' || notif.type === 'edutube_launch') &&
                            'announced a new feature! 🚀'}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 truncate mt-1 text-xs font-medium">
                          {notif.type === 'edutube_video' && (
                            <span className="text-red-600 dark:text-red-400 font-semibold">
                              ▶ &ldquo;{notif.videoTitle}&rdquo;
                            </span>
                          )}
                          {notif.type === 'new_post' && renderTextWithLinks(notif.postContent)}
                          {notif.type === 'like' && renderTextWithLinks(notif.postContent)}
                          {(notif.type === 'comment' ||
                            notif.type === 'reply' ||
                            notif.type === 'edutube_comment') &&
                            renderTextWithLinks(notif.commentContent)}
                          {(notif.type === 'admin_broadcast' || notif.type === 'edutube_launch') &&
                            renderTextWithLinks(notif.postContent || notif.message)}
                          {notif.type === 'note_upload' && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              📄 &ldquo;{notif.noteTitle}&rdquo;
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {notif.createdAt?.toDate
                            ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })
                            : 'Just now'}
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
