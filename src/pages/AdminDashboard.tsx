import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, doc, deleteDoc, getDocs, updateDoc, where, limit, getCountFromServer, startAfter, or, addDoc, serverTimestamp } from 'firebase/firestore';
import { Play, Lock, Unlock, Pause, Trash2, Users, FileText, ShieldAlert, Ban, Eye, X, CheckCircle2, MessageSquareQuote, MessageCircle, RefreshCw, Mail, Send, Sparkles, ExternalLink, Globe, BookOpen, Check, Copy, Eye as EyeIcon, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Navigate, Link } from 'react-router-dom';
import { getFirstName, cn } from '../lib/utils';
import AdminStudyGroupModal from '../components/AdminStudyGroupModal';

const BROADCAST_TEMPLATES = [
  {
    id: 'all-new-features',
    title: '🚀 Mega Update: All New Features & Fast Web Link',
    badge: 'Recommended',
    subject: '🎉 Mega Update: New Features, Notes Hub & Fast Website Live! 🚀',
    actionText: 'Open JEE Community App 🚀',
    actionUrl: 'https://jee-community.netlify.app',
    message: `Namaste JEE Aspirants! 🌟

JEE Community platform par bohot saare naye aur exciting features launch ho chuke hain jo aapki JEE Main & Advanced preparation ko aur bhi aasaan aur superfast banayenge!

✨ Naye Features Ki Puri List:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 1. New Fast Website Link:
Ab aap directly hamari official superfast website par bina kisi rukawat ke study kar sakte hain:
👉 https://jee-community.netlify.app

📱 2. Download Latest Version (Home Screen Install):
Website open karte hi top bar me "Download Latest Version" par click karein aur app ko direct apne phone ki Home Screen par install karein — bilkul native app ki tarah fast, clean aur ad-free!

📚 3. Notes Hub & Formula Sheets:
Physics, Chemistry aur Mathematics ke top toppers ke handwritten notes, chapter-wise formula cheat sheets aur revision material ab ek click me available hain.

💡 4. AI Doubt Solving & Clean KaTeX Math:
Complex numericals, calculus formulas aur reaction mechanisms ab crystal-clear KaTeX format me solve honge. AI Solve button se instant step-by-step guidance payein!

👥 5. Live Study Rooms & Group Discussions:
Apne friends aur serious aspirants ke sath milkar live self-study room join karein, timer lagakar padhai karein aur doubts instantly discuss karein.

⚡ 6. Levels, Badges & Streaks:
Doubt solve karke points aur Level up (Lvl 11+) karein! Community leaderboard me apna rank banayein aur regular study streak maintain karein.

Abhi neeche diye gaye button par click karke naye features explore karein aur apni study start karein:`
  },
  {
    id: 'doubts-session',
    title: '⚡ Doubts Pending? Clear Them Today!',
    badge: 'Doubt Solver',
    subject: '⚡ Doubts Pending? Let\'s Clear Them Together on JEE Community! 🎯',
    actionText: 'Solve Doubts Now 💡',
    actionUrl: 'https://jee-community.netlify.app',
    message: `Hello JEE Aspirants! 🚀

Kya aapke Physics, Chemistry ya Mathematics ke numericals aur concepts atke hue hain? 
Akele pareshan hone ki bilkul zaroorat nahi hai!

JEE Community par abhi aao aur:
1. Apna doubt photo ya text ke roop me post karein
2. Peers, mentors aur AI Solver se instant step-by-step solution payein
3. Live study room me baith kar focused self-study karein

Aapki dream IIT rank regular practice aur daily doubt clearance se hi banegi. Let's study together!

Click below to open the app:`
  },
  {
    id: 'notes-hub',
    title: '📚 Free Handwritten Notes & Formula Sheets',
    badge: 'Study Material',
    subject: '📚 Free JEE Handwritten Notes & Formula Sheets Available Now!',
    actionText: 'Download Notes Free 📖',
    actionUrl: 'https://jee-community.netlify.app/notes',
    message: `Hello JEE Champions! 📖

Humne JEE Community ke "Notes Hub" me high-yield revision material live kar diya hai:
• Physics Most Important Formulas & Derivations
• Chemistry Organic Mechanisms & Reaction Charts
• Mathematics Quick Formula Revision Sheets

Sabhi notes verified aur completely free hain. Neeche diye button par click karein aur revision shuru karein:`
  }
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'reports' | 'feedback' | 'beats' | 'groups' | 'broadcast'>('posts');
  const [broadcastSubject, setBroadcastSubject] = useState(BROADCAST_TEMPLATES[0].subject);
  const [broadcastMessage, setBroadcastMessage] = useState(BROADCAST_TEMPLATES[0].message);
  const [broadcastActionUrl, setBroadcastActionUrl] = useState(BROADCAST_TEMPLATES[0].actionUrl);
  const [broadcastActionText, setBroadcastActionText] = useState(BROADCAST_TEMPLATES[0].actionText);
  const [broadcastViewTab, setBroadcastViewTab] = useState<'edit' | 'preview'>('edit');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [pendingBeats, setPendingBeats] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [totalPostsCount, setTotalPostsCount] = useState<number>(0);
  const [usersLastDoc, setUsersLastDoc] = useState<any>(null);
  const [usersHasMore, setUsersHasMore] = useState<boolean>(true);
  const [broadcastingBot, setBroadcastingBot] = useState(false);

  const handleBroadcastBotToAllGroups = async () => {
    if (!studyGroups || studyGroups.length === 0) return;
    if (!confirm("Are you sure you want to send Inspector Chulbul warning to ALL Study Groups?")) return;
    
    setBroadcastingBot(true);
    try {
      const promises = studyGroups.map(group => 
        addDoc(collection(db, 'study_groups', group.id, 'messages'), {
          text: "Hello! Mera name Inspector Chulbul hai 👮‍♂️ aur mera kaam hai groups ko manage karna. Sabhi GCs par meri nazar hai. Padhai ke alawa koi spam ya harassment hua toh GC permanent delete ho jayegi! 🚨",
          userId: 'inspector-chulbul-bot',
          userName: 'Inspector Chulbul 👮‍♂️',
          userPhoto: '/chulbul.png',
          createdAt: serverTimestamp(),
          type: 'text',
          isBot: true,
          isToxic: false
        })
      );
      await Promise.all(promises);
      toast.success(`Warning sent to ${studyGroups.length} groups!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to broadcast warning");
    } finally {
      setBroadcastingBot(false);
    }
  };
  const [usersLoadingMore, setUsersLoadingMore] = useState<boolean>(false);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState<boolean>(false);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [adminViewingGroup, setAdminViewingGroup] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isAdmin = user?.email === 'aistoryimage1999@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAdminData = async () => {
      try {
        // Fetch Posts
        const postsQuery = query(collection(db, 'posts'), where('reportCount', '>', 0), limit(50));
        const postsSnap = await getDocs(postsQuery);
        const fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(fetchedPosts);
        
        const reportedAuthorIds = fetchedPosts.filter((p: any) => p.reportCount > 0).map((p: any) => p.authorId);
        if (reportedAuthorIds.length > 0) {
          const uniqueAuthorIds = [...new Set(reportedAuthorIds)];
          const { getDoc } = await import('firebase/firestore');
          const authorDocs = await Promise.all(uniqueAuthorIds.map(id => getDoc(doc(db, 'users', id as string))));
          const authors = authorDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() }));
          setUsers(prev => {
             const newUsers = [...prev];
             authors.forEach(a => {
                if (!newUsers.find(u => u.id === a.id)) newUsers.push(a);
             });
             return newUsers;
          });
        }
      } catch (e) { console.error("Error fetching posts:", e); }

      // Fetch Counts via Firebase getCountFromServer
      try {
        const usersCountSnap = await getCountFromServer(collection(db, 'users'));
        setTotalUsersCount(usersCountSnap.data().count);
        
        const postsCountSnap = await getCountFromServer(collection(db, 'posts'));
        setTotalPostsCount(postsCountSnap.data().count);
      } catch (err) {
        console.error("Error fetching stats from Firestore:", err);
      }

      // Fetch Feedback
      try {
        const feedbackQuery = query(collection(db, 'feedback'), limit(50));
        const feedbackSnap = await getDocs(feedbackQuery);
        setFeedbackList(feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error("Error fetching feedback:", e); }

      // Fetch Study Groups
      try {
        const groupsQuery = query(collection(db, 'study_groups'), orderBy('createdAt', 'desc'), limit(50));
        const groupsSnap = await getDocs(groupsQuery);
        setStudyGroups(groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error("Error fetching study groups:", e); }

      // Fetch Pending Beats
      try {
        const beatsQuery = query(collection(db, 'beats'), where('status', '==', 'pending'), limit(50));
        const beatsSnap = await getDocs(beatsQuery);
        setPendingBeats(beatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error("Error fetching beats:", e); }
      
      setLoading(false);
    };
    
    fetchAdminData();
  }, [isAdmin]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
      <p className="text-slate-500 dark:text-slate-400">You do not have permission to view the admin dashboard.</p>
    </div>
  );

  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  const handleLoadMoreUsers = async () => {
    if (!usersLastDoc || !usersHasMore) return;
    setUsersLoadingMore(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(usersLastDoc), limit(20));
      const snapshot = await getDocs(q);
      const newUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(prev => [...prev, ...newUsers]);
      setUsersLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < 20) {
        setUsersHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more users:", err);
    }
    setUsersLoadingMore(false);
  };

  const handleRefreshUsersCount = async () => {
    setIsRefreshingUsers(true);
    try {
      const usersCountSnap = await getCountFromServer(collection(db, 'users'));
      setTotalUsersCount(usersCountSnap.data().count);
    } catch (countErr) {
      console.error("Error refreshing total users count:", countErr);
    }
    setIsRefreshingUsers(false);
  };

  const [isDeletingOld, setIsDeletingOld] = useState(false);
  const handleDeleteOldPosts = async () => {
    if (!window.confirm("Are you sure you want to delete all posts older than 48 hours? This will also remove them from the database to save reads.")) return;
    setIsDeletingOld(true);
    try {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const q = query(collection(db, 'posts'), where('createdAt', '<', twoDaysAgo));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'posts', d.id)));
      await Promise.all(deletePromises);
      toast.success(`Deleted ${snapshot.docs.length} old posts`);
      setPosts(prev => prev.filter(p => !snapshot.docs.find(d => d.id === p.id)));
      
      const postsCountSnap = await getCountFromServer(collection(db, 'posts'));
      setTotalPostsCount(postsCountSnap.data().count);
    } catch (err: any) {
      console.error("Error deleting old posts:", err);
      toast.error("Failed to delete old posts. You might need a composite index.");
    }
    setIsDeletingOld(false);
  };

  const CLOUD_RUN_SERVER_URL = "https://ais-pre-7z74mvln6wxh7omqrc72ca-806584178069.asia-southeast1.run.app";

  const sendBroadcastToServer = async (payload: {
    subject: string;
    message: string;
    emails: string[];
    actionUrl: string;
    actionText: string;
  }) => {
    const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
    const urlsToTry = isNetlify
      ? [`${CLOUD_RUN_SERVER_URL}/api/admin/send-reminders`, '/api/admin/send-reminders']
      : ['/api/admin/send-reminders', `${CLOUD_RUN_SERVER_URL}/api/admin/send-reminders`];

    let lastErrorMsg = '';

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const text = await response.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          continue;
        }

        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch (e) {
          continue;
        }

        if (response.ok && data.success) {
          return data;
        }
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'Server error';
        if (lastErrorMsg.includes('credentials') || lastErrorMsg.includes('Invalid') || lastErrorMsg.includes('Failed to send')) {
          throw new Error(lastErrorMsg);
        }
      }
    }

    throw new Error(lastErrorMsg || 'Could not connect to email delivery server');
  };

  const handleBroadcast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    
    setIsBroadcasting(true);
    const toastId = toast.loading("Fetching users...");
    
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const emails = usersSnap.docs
        .map(doc => doc.data().email)
        .filter(email => email && email.includes('@'));
        
      if (emails.length === 0) {
        toast.error("No registered users with email found", { id: toastId });
        setIsBroadcasting(false);
        return;
      }
      
      toast.loading(`Sending direct email to ${emails.length} users...`, { id: toastId });

      await sendBroadcastToServer({
        subject: broadcastSubject,
        message: broadcastMessage,
        emails: emails,
        actionUrl: broadcastActionUrl,
        actionText: broadcastActionText
      });

      toast.success(`Successfully sent emails directly to ${emails.length} users!`, { id: toastId, duration: 6000 });
    } catch (err: any) {
      console.error("Broadcast error:", err);
      toast.error(err.message || "Failed to send emails", { id: toastId, duration: 6000 });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleTestEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    
    setIsTestingEmail(true);
    const testEmail = user?.email || 'aistoryimage1999@gmail.com';
    const toastId = toast.loading(`Sending test email to ${testEmail}...`);
    
    try {
      await sendBroadcastToServer({
        subject: `[TEST] ${broadcastSubject}`,
        message: broadcastMessage,
        emails: [testEmail],
        actionUrl: broadcastActionUrl,
        actionText: broadcastActionText
      });

      toast.success(`Test email sent successfully to ${testEmail}!`, { id: toastId, duration: 6000 });
    } catch (err: any) {
      console.error("Test email error:", err);
      toast.error(err.message || "Failed to send test email", { id: toastId, duration: 6000 });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleCopyAllEmails = async () => {
    const toastId = toast.loading("Fetching all student emails from database...");
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const emails = usersSnap.docs
        .map(doc => doc.data().email)
        .filter(email => email && email.includes('@'));
      
      const uniqueEmails = [...new Set(emails)];
      if (uniqueEmails.length === 0) {
        toast.error("No student emails found in database.", { id: toastId });
        return;
      }
      
      const emailString = uniqueEmails.join(', ');
      await navigator.clipboard.writeText(emailString);
      toast.success(`Copied ${uniqueEmails.length} student emails! Gmail BCC me paste karein. 📋`, { id: toastId, duration: 6000 });
    } catch (err: any) {
      toast.error("Failed to fetch emails: " + err.message, { id: toastId });
    }
  };

  const handleOpenInGmail = async () => {
    const toastId = toast.loading("Opening Gmail with pre-filled details...");
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const emails = usersSnap.docs
        .map(doc => doc.data().email)
        .filter(email => email && email.includes('@'));
      
      const uniqueEmails = [...new Set(emails)];
      const fullBody = `${broadcastMessage}\n\n👉 Open Website: ${broadcastActionUrl}`;
      
      if (uniqueEmails.length > 0) {
        await navigator.clipboard.writeText(uniqueEmails.join(', '));
      }
      
      const bccList = uniqueEmails.slice(0, 60).join(',');
      const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(broadcastSubject)}&body=${encodeURIComponent(fullBody)}`;
      window.location.href = mailtoUrl;
      
      toast.success(`Gmail open ho raha hai! Sabhi ${uniqueEmails.length} emails clipboard me bhi copy ho gaye hain. 📋`, { id: toastId, duration: 7000 });
    } catch (err: any) {
      toast.error("Error opening Gmail: " + err.message, { id: toastId });
    }
  };

  const handleDeletePost = (postId: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'posts', postId));
          fetch('/api/admin/stats/posts/decrement', { method: 'POST' }).catch(console.error);
        } catch (err) {
          console.error('Error deleting post:', err?.message || 'Error');
          alert('Failed to delete post.');
        }
        setShowConfirmModal(null);
      }
    });
  };

  
  const handleClearFlag = async (groupId: string) => {
    try {
      await updateDoc(doc(db, 'study_groups', groupId), { needsAdminAttention: false });
      setStudyGroups(prev => prev.map(g => g.id === groupId ? { ...g, needsAdminAttention: false } : g));
      toast.success("Flag cleared");
    } catch (e) {
      toast.error("Error clearing flag");
    }
  };

  
  const handleBlockGroup = (groupId: string, isCurrentlyBlocked: boolean) => {
    setShowConfirmModal({
      isOpen: true,
      title: isCurrentlyBlocked ? 'Unblock Study Group' : 'Block Study Group',
      message: isCurrentlyBlocked ? 'Are you sure you want to unblock this group? Members will be able to chat again.' : 'Are you sure you want to block this group? Members will be temporarily restricted from chatting.',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "study_groups", groupId), { isBlocked: !isCurrentlyBlocked });
          setStudyGroups(prev => prev.map(g => g.id === groupId ? { ...g, isBlocked: !isCurrentlyBlocked } : g));
          toast.success(isCurrentlyBlocked ? "Study group unblocked." : "Study group blocked.");
        } catch (e) {
          console.error(e);
          toast.error("Error updating group status.");
        }
        setShowConfirmModal(null);
      }
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Delete Study Group',
      message: 'Are you sure you want to completely delete this study group? All messages and data will be permanently removed, and all members will be kicked out.',
      onConfirm: async () => {
        try {
          const msgQ = query(collection(db, "study_groups", groupId, "messages"));
          const msgSnap = await getDocs(msgQ);
          const deletePromises = msgSnap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
          
          const typingQ = query(collection(db, "study_groups", groupId, "typing"));
          const typingSnap = await getDocs(typingQ);
          const typingPromises = typingSnap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(typingPromises);

          await deleteDoc(doc(db, "study_groups", groupId));
          setStudyGroups(prev => prev.filter(g => g.id !== groupId));
          toast.success("Study group completely deleted.");
        } catch (e) {
          console.error(e);
          toast.error("Error deleting group.");
        }
      }
    });
  };

  const handleDeleteUser = (userId: string, userEmail?: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Delete User Profile',
      message: 'Are you sure you want to delete this user profile? Their email will be permanently banned from signing up or logging in. All their data across the platform will be permanently deleted.',
      onConfirm: async () => {
        try {
          if (userEmail) {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'banned_emails', userEmail), {
              bannedAt: new Date().toISOString()
            });
          }
          
          const deleteQueryDocs = async (collName: string, field: string) => {
            const q = query(collection(db, collName), where(field, '==', userId));
            const snap = await getDocs(q);
            const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
          };

          await Promise.all([
            deleteQueryDocs('posts', 'authorId'),
            deleteQueryDocs('comments', 'authorId'),
            deleteQueryDocs('study_notes', 'authorId'),
            deleteQueryDocs('beats', 'userId'),
            deleteQueryDocs('feedback', 'userId'),
            deleteQueryDocs('note_upvotes', 'userId'),
            deleteQueryDocs('notifications', 'recipientId'),
            deleteQueryDocs('notifications', 'senderId'),
            deleteDoc(doc(db, 'study_sessions', userId)),
            deleteDoc(doc(db, 'users', userId))
          ]);
          
          fetch('/api/admin/stats/users/decrement', { method: 'POST' }).catch(console.error);
          
          setUsers(prev => prev.filter(u => u.id !== userId));
          setSearchResults(prev => prev.filter(u => u.id !== userId));
          setTotalUsersCount(prev => Math.max(0, prev - 1));
          if (selectedUser?.id === userId) setSelectedUser(null);
          toast.success('User and all associated data deleted successfully');
        } catch (err: any) {
          console.error('Error deleting user:', err?.message || 'Error');
          alert('Failed to delete user profile.');
        }
        setShowConfirmModal(null);
      }
    });
  };


  const handleClearReports = (postId: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Dismiss Reports',
      message: 'Are you sure you want to clear all reports for this post?',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'posts', postId), {
            reportCount: 0,
            reportedBy: [],
            reports: []
          });
        } catch (err) {
          console.error('Error clearing reports:', err?.message || 'Error');
          alert('Failed to clear reports.');
        }
        setShowConfirmModal(null);
      }
    });
  };

  const [playingBeatId, setPlayingBeatId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlayBeat = (beat: any) => {
    if (playingBeatId === beat.id) {
       if (audioRef.current) {
         if (audioRef.current.paused) audioRef.current.play();
         else { audioRef.current.pause(); setPlayingBeatId(null); }
       }
    } else {
       if (audioRef.current) audioRef.current.pause();
       setPlayingBeatId(beat.id);
       setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = beat.audioUrl;
            audioRef.current.play();
          }
       }, 50);
    }
  };

  const handleApproveBeat = (id: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Approve Track',
      message: 'Are you sure you want to approve this track for public listening?',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'beats', id), { status: 'approved' });
          toast.success('Track approved!');
        } catch (err) {
          console.error(err?.message || 'Error');
          toast.error('Failed to approve track');
        }
        setShowConfirmModal(null);
      }
    });
  };

  const handleDeleteBeat = (id: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Reject Track',
      message: 'Are you sure you want to delete this track?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'beats', id));
          toast.success('Track deleted');
        } catch (err) {
          console.error(err?.message || 'Error');
          toast.error('Failed to delete track');
        }
        setShowConfirmModal(null);
      }
    });
  };

  
  const handleReplySubmit = async (feedbackId: string) => {
    if (!replyContent.trim()) return;
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), {
        adminReply: replyContent.trim(),
        repliedAt: new Date()
      });
      setReplyingTo(null);
      setReplyContent('');
      toast.success('Reply sent successfully');
    } catch (err: any) {
      console.error('Error replying:', err?.message || 'Error');
      toast.error('Failed to send reply');
    }
  };


  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const termLower = term.toLowerCase();
      // 1. Prefix search on username
      const q1 = query(collection(db, 'users'), where('username', '>=', termLower), where('username', '<=', termLower + '\uf8ff'), limit(10));
      // 2. Exact match on email
      const q2 = query(collection(db, 'users'), where('email', '==', termLower), limit(5));
      // 3. Prefix search on fullName (case-sensitive as stored)
      const q3 = query(collection(db, 'users'), where('fullName', '>=', term), where('fullName', '<=', term + '\uf8ff'), limit(10));
      // 4. Prefix search on fullName (capitalized first letter, common case)
      const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
      const q4 = query(collection(db, 'users'), where('fullName', '>=', termCapitalized), where('fullName', '<=', termCapitalized + '\uf8ff'), limit(10));

      const [snap1, snap2, snap3, snap4] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)]);
      const resultsMap = new Map();
      
      snap1.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      snap2.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      snap3.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      snap4.docs.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      
      setSearchResults(Array.from(resultsMap.values()));
    } catch (err) {
      console.error("Error searching users", err);
    }
    setIsSearching(false);
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Delete Feedback',
      message: 'Are you sure you want to delete this feedback?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'feedback', feedbackId));
          setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
        } catch (err) {
          console.error('Error deleting feedback:', err?.message || 'Error');
          alert('Failed to delete feedback.');
        }
        setShowConfirmModal(null);
      }
    });
  };

  const handleToggleBlockUser = (userId: string, currentStatus: boolean) => {
    setShowConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Unblock User' : 'Block User',
      message: `Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', userId), {
            isBlocked: !currentStatus
          });
          if (selectedUser?.id === userId) {
            setSelectedUser({ ...selectedUser, isBlocked: !currentStatus });
          }
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
          setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
        } catch (err) {
          console.error('Error updating user block status:', err?.message || 'Error');
          alert('Failed to update user block status.');
        }
        setShowConfirmModal(null);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage community content and users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Total Posts</p>
              <button 
                onClick={handleDeleteOldPosts} 
                disabled={isDeletingOld}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                title="Delete Posts Older Than 48h"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeletingOld ? 'animate-pulse' : ''}`} />
              </button>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalPostsCount || posts.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Total Users</p>
              <button 
                onClick={handleRefreshUsersCount} 
                disabled={isRefreshingUsers}
                className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                title="Refresh Total Users"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalUsersCount || users.length}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex flex-wrap overflow-x-auto">
        <Link
          to="/status-replies"
          className="px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white bg-indigo-100 flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Status Replies
        </Link>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'posts' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
          }`}
        >
          Manage Posts
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
          }`}
        >
          Reports {posts.filter(p => p.reportCount > 0).length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600 text-xs">{posts.filter(p => p.reportCount > 0).length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
          }`}
        >
          Manage Users {totalUsersCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-600 text-xs">{totalUsersCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center whitespace-nowrap ${
            activeTab === 'feedback' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
          }`}
        >
          Feedback {feedbackList.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-600 text-xs">{feedbackList.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('beats')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center whitespace-nowrap ${
            activeTab === 'beats' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
          }`}
        >
          Verify Beats {pendingBeats?.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 text-xs">{pendingBeats.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center whitespace-nowrap ${
            activeTab === 'groups' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
          }`}
        >
          Study Groups {studyGroups?.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-600 text-xs">{studyGroups.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center whitespace-nowrap ${
            activeTab === 'broadcast' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white'
          }`}
        >
          <Mail className="w-4 h-4 mr-1.5" /> Broadcast Emails
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading data...</div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:justify-between items-start md:items-center bg-white dark:bg-slate-900 gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-slate-800 dark:text-white">Registered Users</h3>
                <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold flex items-center space-x-2 w-fit">
                  <Users className="w-4 h-4" />
                  <span>Total Users: {totalUsersCount.toLocaleString()}</span>
                </div>
              </div>
              <form onSubmit={handleSearchUsers} className="w-full md:w-72 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search by name, username, or email..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) setSearchResults([]);
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="submit" disabled={isSearching} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  {isSearching ? '...' : 'Search'}
                </button>
              </form>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4">Target Year</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!searchQuery ? (
                  <tr><td colSpan={4} className="p-8 text-center bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">Search to manage users</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">Find users by name, username, or email</p>
                  </td></tr>
                ) : searchResults.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-500 dark:text-slate-400">No users found.</td></tr>
                ) : (
                  searchResults.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={getFirstName(u.fullName)} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                            {getFirstName(u.fullName)?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                            <span>{getFirstName(u.fullName)}</span>
                            {u.isBlocked && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Blocked</span>}
                            {u.role === 'admin' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Admin</span>}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{u.state || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{u.targetYear || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleToggleBlockUser(u.id, u.isBlocked)}
                        className={`${u.isBlocked ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'} p-2 rounded-lg transition-colors`}
                        title={u.isBlocked ? "Unblock User" : "Block User"}
                      >
                        {u.isBlocked ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete User Profile"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'reports' ? (
          <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.filter(p => p.reportCount > 0).length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                No reported posts. All good!
              </div>
            ) : (
              posts.filter(p => p.reportCount > 0).map((post) => {
                const author = users.find(u => u.id === post.authorId);
                return (
                <div key={post.id} className="bg-white dark:bg-slate-900 border-2 border-orange-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 px-3 py-1 rounded-bl-xl font-bold text-xs flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    {post.reportCount} Reports
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap mb-4 flex-grow text-sm">{post.text}</p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-orange-100">
                    <button 
                      onClick={() => handleClearReports(post.id)}
                      className="text-slate-600 dark:text-slate-400 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Dismiss
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete Post
                    </button>
                  </div>
                  
                  {post.reports && post.reports.length > 0 && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs font-bold text-orange-800 mb-1">Latest Report Reason:</p>
                      <p className="text-sm text-orange-700">{post.reports[post.reports.length - 1]?.reason || 'User reported'}</p>
                    </div>
                  )}

                  {author && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 -mx-5 -mb-5 p-5">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Author Info</p>
                      <div className="flex items-center space-x-3 mb-4">
                        {author.photoURL ? (
                          <img src={author.photoURL} alt={author.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600">
                            {getFirstName(author.fullName)?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{getFirstName(author.fullName) || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">@{author.username || 'user'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleToggleBlockUser(author.id, author.isBlocked)}
                          className={`${author.isBlocked ? 'text-green-700 hover:bg-green-200 bg-green-100' : 'text-orange-700 hover:bg-orange-200 bg-orange-100'} px-3 py-2 rounded-xl transition-colors text-xs font-bold flex-1 text-center`}
                        >
                          {author.isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(author.id, author.email)}
                          className="text-red-700 hover:bg-red-200 bg-red-100 px-3 py-2 rounded-xl transition-colors text-xs font-bold flex-1 text-center"
                        >
                          Delete User
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )})
            )}
          </div>
        ) : activeTab === 'feedback' ? (
          <div className="p-6 grid gap-4 md:grid-cols-2">
            {feedbackList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                No feedback received yet.
              </div>
            ) : (
              feedbackList.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.userName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.userEmail}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl mb-4">
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{item.content}</p>
                  </div>
                  
                  {item.adminReply && (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-4">
                      <p className="text-xs font-bold text-green-800 mb-1">Your Reply:</p>
                      <p className="text-green-900 whitespace-pre-wrap text-sm">{item.adminReply}</p>
                    </div>
                  )}

                  {replyingTo === item.id ? (
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Write your reply..."
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                          className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(item.id)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {!item.adminReply && (
                        <button
                          onClick={() => setReplyingTo(item.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <MessageSquareQuote className="w-4 h-4" />
                          <span>Reply</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteFeedback(item.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'broadcast' ? (
          <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
            {/* Header & Target Audience Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Broadcast Email Studio
                    <span className="text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Live
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Send announcements, updates, and reminders to all registered students.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 px-3.5 py-2 rounded-xl text-xs">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  Target: <strong className="text-blue-600 dark:text-blue-400">{totalUsersCount || 'All'} Users</strong> (via BCC)
                </span>
              </div>
            </div>

            {/* Quick Templates Selector */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Ready-Made Templates (Click to apply)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">1-click pre-fill</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {BROADCAST_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setBroadcastSubject(tmpl.subject);
                      setBroadcastMessage(tmpl.message);
                      setBroadcastActionUrl(tmpl.actionUrl);
                      setBroadcastActionText(tmpl.actionText);
                      toast.success(`Template applied: ${tmpl.title}`);
                    }}
                    className={cn(
                      "text-left p-3 rounded-xl border transition-all relative group flex flex-col justify-between",
                      broadcastSubject === tmpl.subject 
                        ? "bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-sm" 
                        : "bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-white dark:hover:bg-slate-900"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 uppercase">
                          {tmpl.badge}
                        </span>
                        {broadcastSubject === tmpl.subject && (
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{tmpl.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Switcher: Compose vs Preview */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBroadcastViewTab('edit')}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    broadcastViewTab === 'edit'
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Compose & Edit
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastViewTab('preview')}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    broadcastViewTab === 'preview'
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  Live Preview
                </button>
              </div>

              {/* Website link quick-copy button */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 hidden sm:inline">Website:</span>
                <a
                  href="https://jee-community.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
                >
                  <Globe className="w-3 h-3" />
                  jee-community.netlify.app
                </a>
              </div>
            </div>

            {broadcastViewTab === 'edit' ? (
              <div className="space-y-5">
                {/* Subject Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Email Subject
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(broadcastSubject);
                          toast.success("Subject copied to clipboard! 📋");
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Subject
                      </button>
                      <span className="text-[11px] text-slate-400">({broadcastSubject.length} chars)</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="e.g., 🎉 Mega Update: New Features, Notes Hub & Fast Website Live! 🚀"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-medium text-sm"
                    required
                  />
                </div>

                {/* Quick Insert Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 mr-1 font-medium">Quick Insert:</span>
                    <button
                      type="button"
                      onClick={() => setBroadcastMessage(prev => prev + '\n\n👉 Website Link: https://jee-community.netlify.app')}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      + New Web Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastMessage(prev => prev + '\n\n📱 Download App: Website par "Download Latest Version" par click karke direct Home Screen par add karein.')}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                      📱 + Install Guide
                    </button>
                    {['🚀', '🔥', '📚', '💡', '✨', '🎯', '💎'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setBroadcastMessage(prev => prev + ' ' + emoji)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const fullCopy = `SUBJECT:\n${broadcastSubject}\n\nMESSAGE:\n${broadcastMessage}\n\nLINK:\n${broadcastActionUrl}`;
                      navigator.clipboard.writeText(fullCopy);
                      toast.success("Complete Email content copied! 📋");
                    }}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy All (Full Email)
                  </button>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Email Body Message
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(broadcastMessage);
                        toast.success("Message body copied to clipboard! 📋");
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Message
                    </button>
                  </div>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white resize-y font-mono text-xs sm:text-sm leading-relaxed"
                    required
                  ></textarea>
                </div>

                {/* Call To Action Button Settings */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    Call-to-Action (CTA) Button Settings
                  </span>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={broadcastActionText}
                        onChange={(e) => setBroadcastActionText(e.target.value)}
                        placeholder="e.g. Open JEE Community App 🚀"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Button Target URL
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={broadcastActionUrl}
                          onChange={(e) => setBroadcastActionUrl(e.target.value)}
                          placeholder="https://jee-community.netlify.app"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setBroadcastActionUrl('https://jee-community.netlify.app')}
                          title="Reset to New Netlify Website URL"
                          className="px-2.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Preview Mode */
              <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 text-slate-800">
                  {/* Email Client Simulated Header */}
                  <div className="bg-slate-50 p-3 border-b border-slate-200 text-xs text-slate-500 flex flex-col gap-1 font-sans">
                    <div className="flex justify-between">
                      <span><strong>From:</strong> JEE Community &lt;no-reply@jee-community&gt;</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">BCC: {totalUsersCount || 'All'} Students</span>
                    </div>
                    <div><strong>Subject:</strong> <span className="text-slate-900 font-semibold">{broadcastSubject || '(No Subject)'}</span></div>
                  </div>

                  {/* Rendered Email Body */}
                  <div>
                    {/* Header Banner */}
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 text-center text-white">
                      <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
                        🎓 IIT-JEE Aspirants Community
                      </div>
                      <h1 className="text-2xl font-black tracking-tight text-white m-0">JEE Community</h1>
                      <p className="text-xs text-indigo-100 mt-1">Free Doubt Solving • Notes Hub • Live Study Groups</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-slate-800 text-sm leading-relaxed">
                      <div className="whitespace-pre-wrap font-sans">
                        {broadcastMessage || 'Your message will appear here...'}
                      </div>

                      {/* CTA Button */}
                      <div className="text-center my-8">
                        <a
                          href={broadcastActionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:opacity-95 transition-all"
                        >
                          {broadcastActionText || 'Open JEE Community App 🚀'}
                        </a>
                        <div className="text-center mt-2">
                          <span className="text-xs text-slate-400 font-mono">{broadcastActionUrl}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 p-4 text-center text-slate-400 text-xs border-t border-slate-100">
                      <p className="m-0 mb-1">You received this update because you are a verified member of the JEE Community platform.</p>
                      <p className="m-0">© {new Date().getFullYear()} JEE Community. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sending Actions */}
            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={isBroadcasting || isTestingEmail}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs active:scale-95"
                >
                  {isTestingEmail ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  )}
                  <span>Send Test to Me ({user?.email || 'aistoryimage1999@gmail.com'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to send this broadcast email directly to ALL registered users?`)) {
                      handleBroadcast();
                    }
                  }}
                  disabled={isBroadcasting || isTestingEmail || !broadcastSubject.trim() || !broadcastMessage.trim()}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 active:scale-95"
                >
                  {isBroadcasting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Broadcast directly...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Server Broadcast ({totalUsersCount || 'All'} Users)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1 pt-1">
                <span>⚡ Direct automated server delivery (no Gmail app required)</span>
                <button
                  type="button"
                  onClick={handleCopyAllEmails}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Emails</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'groups' ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Study Groups ({studyGroups.length})</h3>
              <button 
                onClick={handleBroadcastBotToAllGroups}
                disabled={broadcastingBot || studyGroups.length === 0}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                {broadcastingBot ? <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                Broadcast Chulbul Warning to ALL
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {studyGroups.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                  No study groups found.
                </div>
              ) : (
                [...studyGroups].sort((a, b) => {
                  if (a.needsAdminAttention && !b.needsAdminAttention) return -1;
                  if (!a.needsAdminAttention && b.needsAdminAttention) return 1;
                  return 0;
                }).map(group => (
                  <div key={group.id} className={cn("rounded-2xl p-5 flex flex-col relative group overflow-hidden border", group.needsAdminAttention ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700")}>
                    <div className="flex justify-between items-start mb-3">
                       <h4 className={cn("font-bold text-lg", group.needsAdminAttention ? "text-red-900 dark:text-red-400" : "text-slate-900 dark:text-white")}>
                         {group.name}
                       </h4>
                       <span className={cn("text-xs font-bold px-2 py-1 rounded-md", group.needsAdminAttention ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700")}>
                         {group.shortCode}
                       </span>
                    </div>
                    {group.needsAdminAttention && (
                       <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-100/50 p-2 rounded-lg mb-3">
                          <ShieldAlert className="w-4 h-4 shrink-0" /> Toxic content detected
                       </div>
                    )}
                    <div className={cn("flex items-center text-sm mb-4 gap-2", group.needsAdminAttention ? "text-red-700/70" : "text-slate-500")}>
                       <Users className="w-4 h-4" />
                       {group.members?.length || 1} members
                    </div>
                    <div className="mt-auto flex gap-2">
                      <button 
                        onClick={() => setAdminViewingGroup(group)}
                        className={cn("flex-1 border py-2 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2", group.needsAdminAttention ? "bg-white text-red-700 border-red-200 hover:bg-red-50" : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-600 hover:text-indigo-600")}
                      >
                         <Eye className="w-4 h-4" /> Ghost Mode
                      </button>
                      {group.needsAdminAttention && (
                        <button 
                          onClick={() => handleClearFlag(group.id)}
                          className="bg-green-50 text-green-600 px-3 py-2 rounded-xl hover:bg-green-100 transition-colors border border-green-100"
                          title="Clear Flag"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleBlockGroup(group.id, !!group.isBlocked)}
                        className={cn("px-3 py-2 rounded-xl transition-colors", group.isBlocked ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300")}
                        title={group.isBlocked ? "Unblock Group" : "Block Group"}
                      >
                        {group.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(group.id)}
                        className={cn("px-3 py-2 rounded-xl transition-colors", group.needsAdminAttention ? "bg-white text-red-600 hover:bg-red-100 border border-red-200" : "bg-red-50 text-red-600 hover:bg-red-100")}
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      {adminViewingGroup && (
        <AdminStudyGroupModal
          group={adminViewingGroup}
          onClose={() => setAdminViewingGroup(null)}
        />
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white">User Profile</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} alt={getFirstName(selectedUser.fullName)} className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400 text-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                    {getFirstName(selectedUser.fullName)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">{getFirstName(selectedUser.fullName)}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">@{selectedUser.username}</p>
                  <div className="flex space-x-2 mt-2">
                    {selectedUser.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">Admin</span>
                    )}
                    {selectedUser.isBlocked && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">Blocked</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Bio</p>
                  <p className="text-slate-900 dark:text-white text-sm whitespace-pre-wrap">{selectedUser.bio || 'No bio provided.'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Target Exam</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{selectedUser.targetExam || '-'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Target Year</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{selectedUser.targetYear || '-'}</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">State / Region</p>
                  <p className="text-slate-900 dark:text-white font-semibold">{selectedUser.state || '-'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
                <button 
                  onClick={() => handleToggleBlockUser(selectedUser.id, selectedUser.isBlocked)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedUser.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                >
                  {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                </button>
                <button 
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && showConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{showConfirmModal.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{showConfirmModal.message}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmModal.onConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
