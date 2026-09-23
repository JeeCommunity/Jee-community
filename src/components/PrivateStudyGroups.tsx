import { checkToxicity, getToxicWords } from '../lib/moderation';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db, storage } from '../firebase';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, orderBy, addDoc, limit, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ShieldAlert, Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Video, Palette, ChevronDown, Pin, Reply, X, Clock, Play, Settings, Pencil, Trash2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, getFirstName } from '../lib/utils';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

interface PrivateStudyGroupsProps {
  sessions: any[];
  usersData: Record<string, any>;
  getSessionTime: (s: any) => number;
  formatTime: (totalSeconds: number) => string;
  handleUserClick: (userId: string) => void;
}


const highlightToxicWords = (text: string, toxicWords?: string[], isAdmin?: boolean) => {
  if (!isAdmin || !toxicWords || toxicWords.length === 0 || !text) return text;
  
  try {
    const escapedWords = toxicWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp('(' + escapedWords.join('|') + ')', 'gi');
    
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => {
          const isToxic = toxicWords.some(w => w.toLowerCase() === part.toLowerCase());
          if (isToxic) {
            return <span key={i} className="text-red-600 bg-red-100 px-1 rounded mx-[1px] font-bold border border-red-200">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  } catch (e) {
    return text;
  }
};

export default function PrivateStudyGroups({ sessions, usersData, getSessionTime, formatTime, handleUserClick }: PrivateStudyGroupsProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  
  // Navigation inside group
  const [activeGroupTab, setActiveGroupTab] = useState<"chat" | "members">("chat");

  // Forms
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupPhoto, setEditGroupPhoto] = useState("");

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [fetchedUsers, setFetchedUsers] = useState<Record<string, any>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      shouldAutoScrollRef.current = true;
      setShowScrollBottom(false);
    } else {
      shouldAutoScrollRef.current = false;
      setShowScrollBottom(true);
    }
  };
  
  const scrollToBottom = () => {
      if (chatScrollContainerRef.current) {
          chatScrollContainerRef.current.scrollTo({
              top: chatScrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
          });
      }
  };

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  const [isChatDisconnected, setIsChatDisconnected] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };


  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'study_groups'), where('members', 'array-contains', user.uid));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  // Load members when group selected
  useEffect(() => {
    if (!activeGroup) return;
    
    const fetchMembers = async () => {
       for (const mId of activeGroup.members || []) {
           setFetchedUsers(prev => {
               if (prev[mId] || usersData[mId]) return prev;
               // Fire and forget fetch
               getDoc(doc(db, 'users', mId)).then(d => {
                   if (d.exists()) {
                       setFetchedUsers(p => ({...p, [mId]: d.data()}));
                   }
               }).catch(e => {});
               return prev; // We don't update state here, the async callback does
           });
       }
    };
    fetchMembers();
  }, [activeGroup, usersData]);


  // Listen to chat messages if activeGroup exists
  useEffect(() => {
    if (!activeGroup?.id || !user?.uid || isChatDisconnected) return;
    
    const q = query(
      collection(db, 'study_groups', activeGroup.id, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubMessages = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        setMessages(msgs);
        
        const hasMyNewMessage = snap.docChanges().some(change => change.type === 'added' && change.doc.data().userId === user.uid);
        
        if (shouldAutoScrollRef.current || hasMyNewMessage) {
            setTimeout(() => {
              if (chatScrollContainerRef.current) {
                 chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
              }
              shouldAutoScrollRef.current = true;
            }, 100);
        }
    });
    
    return () => unsubMessages();
  }, [activeGroup?.id, user?.uid, isChatDisconnected]);

  // Inactivity timeout for chat
  useEffect(() => {
    if (activeGroup && !isChatDisconnected) {
      let lastInteractionTime = Date.now();
      
      const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
          setIsChatDisconnected(true);
        }, 5 * 60 * 1000); // 5 minutes
      };
      
      resetInactivityTimer();
      
      const handleInteraction = () => {
        const now = Date.now();
        if (now - lastInteractionTime > 1000) { // throttle 1 second
          lastInteractionTime = now;
          resetInactivityTimer();
        }
      };
      
      window.addEventListener('mousemove', handleInteraction);
      window.addEventListener('keydown', handleInteraction);
      window.addEventListener('touchstart', handleInteraction);
      
      return () => {
        window.removeEventListener('mousemove', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };
    }
  }, [activeGroup, isChatDisconnected]);

  const handleCreateGroup = async () => {
    if (!createName.trim()) return;
    const createdGroups = groups.filter(g => g.creatorId === user?.uid);
    if (createdGroups.length > 0) {
      toast.error("You can only create one group.");
      return;
    }

    try {
      const shortCode = "GC-" + Math.random().toString(36).substr(2, 5).toUpperCase();
      const groupData = {
        name: createName.trim(),
        creatorId: user?.uid,
        shortCode,
        members: [user?.uid],
        createdAt: serverTimestamp(),
        pinnedMessageId: null
      };
      await setDoc(doc(db, 'study_groups', shortCode), groupData);
      toast.success("Group created!");
      setIsCreating(false);
      setCreateName("");
      fetchGroups();
    } catch (e) {
      toast.error("Error creating group");
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    const code = joinCode.trim().toUpperCase();
    try {
      const q = query(collection(db, 'study_groups'), where('shortCode', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error("Group not found");
        return;
      }
      const groupDoc = snap.docs[0];
      if (groupDoc.data().members.includes(user?.uid)) {
        toast.error("You are already in this group");
        return;
      }
      await updateDoc(groupDoc.ref, {
        members: arrayUnion(user?.uid)
      });
      toast.success("Joined group!");
      setIsJoining(false);
      setJoinCode("");
      fetchGroups();
    } catch (e) {
      toast.error("Error joining group");
    }
  };

  
  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!activeGroup || activeGroup.creatorId !== user?.uid) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) return;
    
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id), {
        members: arrayRemove(memberId)
      });
      toast.success(`${memberName} removed`);
      const newMembers = activeGroup.members.filter((id: string) => id !== memberId);
      setActiveGroup({ ...activeGroup, members: newMembers });
      fetchGroups();
    } catch (e) {
      toast.error("Error removing member");
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!window.confirm("Are you sure you want to leave this study group?")) return;
    try {
      await updateDoc(doc(db, 'study_groups', groupId), {
        members: arrayRemove(user?.uid)
      });
      toast.success("Left group");
      setActiveGroup(null);
      fetchGroups();
    } catch (e) {
      toast.error("Error leaving group");
    }
  };

  
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroupName.trim() || !activeGroup || activeGroup.creatorId !== user?.uid) return;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id), {
        name: editGroupName.trim(),
        photoURL: editGroupPhoto.trim() || null
      });
      toast.success("Group updated!");
      setIsEditingGroup(false);
      setActiveGroup({...activeGroup, name: editGroupName.trim(), photoURL: editGroupPhoto.trim() || null});
      fetchGroups();
    } catch (err) {
      toast.error("Error updating group");
    }
  };

  
  const handleStartMeet = async () => {
    if (!activeGroup || !user) return;
    try {
      toast.loading("Starting video call...", { id: 'meet-start' });
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) throw new Error("Could not get access token");

      const response = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credential.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const meetData = await response.json();
      if (!response.ok) throw new Error(meetData.error?.message || "Failed to create meeting");

      await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
        text: `Join the Video Call! 📹
${meetData.meetingUri}`,
        userId: user.uid,
        userName: profile?.fullName || profile?.username || "Unknown",
        userPhoto: profile?.photoURL || null,
        createdAt: serverTimestamp(),
        type: 'meet',
        meetUri: meetData.meetingUri,
        isToxic: false,
        toxicWords: []
      });
      
      toast.success("Video call started!", { id: 'meet-start' });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/popup-closed-by-user') {
        toast.error("Popup was closed. Please select your Google account to start the call.", { id: 'meet-start', duration: 4000 });
      } else if (e.code === 'auth/popup-blocked') {
        toast.error("Popup blocked! Please allow popups for this site to start the call.", { id: 'meet-start', duration: 4000 });
      } else {
        toast.error("Failed to start video call: " + (e.message || "Unknown error"), { id: 'meet-start' });
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup || !user || !profile) return;
    
    const messageText = newMessage.trim();
    const toxicWordsFound = getToxicWords(messageText);
    const isToxic = toxicWordsFound.length > 0;
    
    try {
      await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
        text: messageText,
        userId: user.uid,
        userName: profile.fullName || profile.username || "Unknown",
        userPhoto: profile.photoURL || null,
        createdAt: serverTimestamp(),
        replyToId: replyingTo?.id || null,
        replyToText: replyingTo?.text || null,
        replyToUser: replyingTo?.userName || null,
        type: 'text',
        isToxic: isToxic,
        toxicWords: toxicWordsFound
      });
      
      // Moderation Check
      if (isToxic) {
         updateDoc(doc(db, 'study_groups', activeGroup.id), { needsAdminAttention: true }).catch(console.error);
      }
      
      setNewMessage("");
      setReplyingTo(null);
    } catch (e) {
      toast.error("Error sending message");
    }
  };
  
  const handleSaveEdit = async (msgId: string) => {
    if (!editMessageText.trim() || !activeGroup) return;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id, 'messages', msgId), {
        text: editMessageText.trim()
      });
      setEditingMessageId(null);
      setEditMessageText("");
    } catch (err) {
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeGroup || !user) return;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id, 'messages', msgId), { isDeleted: true });
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handlePinMessage = async (msgId: string) => {
     try {
       await updateDoc(doc(db, 'study_groups', activeGroup.id), {
          pinnedMessageId: msgId
       });
       setActiveGroup({...activeGroup, pinnedMessageId: msgId});
       toast.success("Message pinned");
     } catch (e) {
       toast.error("Error pinning message");
     }
  };
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileClick = () => {
     fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target;
      const file = target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB");
          return;
      }
      
      setIsUploading(true);
      const loadingToast = toast.loading("Uploading file...");
      
      try {
          // Use centralized uploader (which handles compression and Firebase storage internally)
          const fileUrl = await uploadFileToCloudinary(file);
          
          await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
             text: "",
             userId: user?.uid,
             userName: profile?.fullName || profile?.username || "Unknown",
             userPhoto: profile?.photoURL || null,
             createdAt: serverTimestamp(),
             fileUrl: fileUrl,
             fileName: file.name,
             fileType: file.type,
             type: file.type.startsWith('image/') ? 'image' : 'file'
          });
          
          toast.success("File sent!");
      } catch(error: any) {
          console.error("Upload error:", error);
          toast.error(error?.message || "Failed to upload file");
      } finally {
          setIsUploading(false);
          toast.dismiss(loadingToast);
          target.value = '';
      }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  const hasCreatedGroup = groups.some(g => g.creatorId === user?.uid);

  if (activeGroup) {
    const groupMembers = activeGroup.members.map((memberId: string) => {
      const session = sessions.find((s: any) => s.id === memberId) || { id: memberId, isStudying: false, goals: [] };
      const uData = fetchedUsers[memberId] || usersData[memberId] || {};
      return {
        ...session,
        fullName: uData.fullName || session.fullName || "Unknown User",
        userName: uData.username || session.userName || "Unknown",
        photoURL: uData.photoURL || session.photoURL || null,
      };
    });
    
    const onlineMembers = groupMembers.filter((m: any) => m.isStudying);
    
    const pinnedMessage = activeGroup.pinnedMessageId ? messages.find(m => m.id === activeGroup.pinnedMessageId) : null;

    return (
      <div className="bg-white md:rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row md:min-h-[600px] md:h-[calc(100vh-140px)] md:max-h-[800px] fixed md:relative top-0 left-0 right-0 bottom-0 z-[100] md:z-auto h-[100dvh] w-full max-w-[100vw]">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex flex-col w-64 bg-slate-50 border-r border-slate-100 p-4 shrink-0">
          <button onClick={() => setActiveGroup(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm mb-6 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </button>
          
          <div className="flex items-center gap-3 px-2 mb-8">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden">
               {activeGroup.photoURL ? <img src={activeGroup.photoURL} alt={activeGroup.name} className="w-full h-full object-cover" /> : activeGroup.name.charAt(0).toUpperCase()}
             </div>
             <div className="min-w-0">
               <h2 className="font-bold text-slate-800 truncate leading-tight">{activeGroup.name}</h2>
               <div className="text-xs text-slate-500 font-medium">{groupMembers.length} members</div>
             </div>
          </div>
          
          <nav className="flex flex-col gap-1.5 flex-1">
             <button onClick={() => setActiveGroupTab('chat')} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all", activeGroupTab === 'chat' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
               <MessageSquare className="w-4 h-4" /> Group Chat
             </button>
             <button onClick={() => setActiveGroupTab('members')} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all", activeGroupTab === 'members' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
               <Users className="w-4 h-4" /> Members
             </button>
          </nav>
          
          <div className="mt-auto px-2">
             <button onClick={() => handleLeaveGroup(activeGroup.id)} className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl text-sm font-bold transition-colors w-full">
               <LogOut className="w-4 h-4" /> Leave Group
             </button>
          </div>
        </div>
        
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-white">
           
           {/* MOBILE HEADER */}
           <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setActiveGroup(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 truncate leading-tight text-[15px]">{activeGroup.name}</h2>
                  <div className="text-[11px] text-slate-500 font-medium">{groupMembers.length} members</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleStartMeet} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 shrink-0 shadow-sm border border-blue-100" title="Start Video Call">
                   <Video className="w-4 h-4" />
                </button>
                <button onClick={() => navigate(`/whiteboard/${activeGroup.id}`)} className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 hover:bg-purple-100 shrink-0 shadow-sm border border-purple-100" title="Whiteboard">
                   <Palette className="w-4 h-4" />
                </button>
                <button onClick={() => handleLeaveGroup(activeGroup.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 shrink-0 shadow-sm border border-red-100" title="Leave Group">
                   <LogOut className="w-4 h-4 ml-0.5" />
                </button>
              </div>
           </div>

           {/* SCROLLABLE CONTENT CONTAINER */}
           <div className="flex-1 overflow-hidden relative flex flex-col bg-white min-h-0">
              
              {/* CHAT TAB */}
              {activeGroupTab === 'chat' && (
                 <div className="flex flex-col flex-1 min-h-0 bg-slate-50/50">
                    {/* Pinned Message */}
                    {pinnedMessage && (
                       <div className="bg-white border-b border-slate-100 p-3 flex items-start gap-3 shadow-sm sticky top-0 z-10 shrink-0">
                          <Pin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                             <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Pinned Message</div>
                             <p className="text-sm text-slate-700 truncate">{pinnedMessage.text}</p>
                          </div>
                          {activeGroup.creatorId === user?.uid && (
                             <button onClick={() => handlePinMessage("")} className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                               <X className="w-3.5 h-3.5" />
                             </button>
                          )}
                       </div>
                    )}

                    {/* Messages Area */}
                    <div ref={chatScrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 relative touch-pan-y">
                       {isChatDisconnected && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
                             <button onClick={() => setIsChatDisconnected(false)} className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold flex flex-col items-center gap-3 shadow-lg hover:bg-slate-900 transition-colors text-center w-full max-w-sm border border-slate-700">
                                <Clock className="w-8 h-8 text-slate-300" />
                                <div>
                                   <div className="text-[15px] mb-1">Chat disconnected due to inactivity</div>
                                   <div className="text-xs text-slate-400 font-normal">Click to reconnect and see new messages</div>
                                </div>
                             </button>
                          </div>
                       )}
                       {messages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                               <MessageSquare className="w-8 h-8 text-blue-300" />
                             </div>
                             <h3 className="font-bold text-slate-600 mb-1">No messages yet</h3>
                             <p className="text-sm max-w-xs">Start the conversation! Share links, notes, or say hi.</p>
                          </div>
                       ) : (
                          messages.map((msg, idx) => {
                                      
                                      const isMe = msg.userId === user?.uid;
                             if (msg.isDeleted && isMe) return null;
                                            const isBot = msg.userId === 'inspector-chulbul-bot';
                             const showAvatar = idx === 0 || messages[idx-1].userId !== msg.userId;
                             
                             if (isBot) {
                               return (
                                 <div key={msg.id} className="flex flex-col w-full my-6">
                                   <div className="flex items-start gap-3 md:gap-4 group relative w-full px-2">
                                     {/* Chulbul Animated Avatar */}
                                     <div className="w-24 md:w-32 shrink-0 relative z-20 animate-[bounce_2s_ease-in-out_infinite]">
                                       <img src="/chulbul.png" alt="Chulbul" className="w-full h-auto object-contain drop-shadow-2xl" />
                                     </div>
                                     {/* Comic Speech Bubble */}
                                     <div className="bg-white border-2 border-red-500 text-red-900 px-5 py-4 rounded-3xl shadow-xl z-10 flex-1 relative animate-[pulse_3s_ease-in-out_infinite] mt-2 md:mt-4">
                                       {/* Speech Bubble Tail pointing left towards mouth */}
                                       <div className="absolute -left-[11px] top-6 w-5 h-5 bg-white border-l-2 border-b-2 border-red-500 transform rotate-45 rounded-bl-sm z-10"></div>
                                       
                                       <div className="flex items-center gap-2 mb-2">
                                          <ShieldAlert className="w-5 h-5 text-red-600" />
                                          <span className="font-black text-red-700 block text-base uppercase tracking-wider">{msg.userName}</span>
                                       </div>
                                       {msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all text-[15px] font-bold text-slate-800" style={{ wordBreak: 'break-word' }}>{msg.text}</div>}
                                       <div className="text-[10px] text-right font-bold text-slate-400 mt-2">
                                           {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               );
                             }

                             return (
                                <div key={msg.id} className={cn("flex flex-col max-w-[85%] min-w-0", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                   {/* Username (only if different from previous) */}
                                   {showAvatar && (
                                      <span className={cn("text-[11px] font-bold mb-1 px-1", isMe ? "mr-2 text-blue-400" : "ml-12 text-slate-400")}>{isMe ? "You" : msg.userName}</span>
                                   )}
                                   
                                   <div className="flex items-end gap-2 group relative max-w-full min-w-0">
                                      
                                      {!isMe && showAvatar ? (
                                         <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-white shadow-sm mb-1">
                                            {msg.userPhoto ? <img src={msg.userPhoto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{msg.userName.charAt(0).toUpperCase()}</div>}
                                         </div>
                                      ) : !isMe ? (
                                         <div className="w-8 shrink-0"></div>
                                      ) : null}

                                      {/* Message Bubble container */}
                                      <div className={cn("flex flex-col gap-1 relative min-w-0 max-w-full", isMe ? "items-end" : "items-start")}>
                                         
                                         {/* Reply Context */}
                                         {msg.replyToId && (
                                            <div className={cn("bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs border border-slate-200/50 mb-[-10px] relative z-0 flex items-center gap-1.5 max-w-full min-w-0", isMe ? "mr-2 pr-6" : "ml-2 pl-6")}>
                                               <Reply className="w-3 h-3 text-slate-400 shrink-0" />
                                               <span className="font-bold text-slate-600 shrink-0 max-w-[100px] truncate">{msg.replyToUser}:</span>
                                               <span className="text-slate-500 truncate min-w-0 flex-1">{msg.replyToText}</span>
                                            </div>
                                         )}

                                         {/* Bubble */}
                                         <div 
                                            onTouchStart={(e) => {
                                               e.currentTarget.dataset.touchStartX = e.touches[0].clientX.toString();
                                            }}
                                            onTouchEnd={(e) => {
                                               const startX = parseFloat(e.currentTarget.dataset.touchStartX || "0");
                                               const endX = e.changedTouches[0].clientX;
                                               if (Math.abs(startX - endX) > 40) {
                                                  setReplyingTo(msg);
                                               }
                                            }}
                                            onClick={(e) => {
                                               if (window.innerWidth < 768) {
                                                  const actions = document.getElementById(`actions-${msg.id}`);
                                                  if (actions) {
                                                     const isHidden = actions.classList.contains('hidden');
                                                     document.querySelectorAll('.mobile-action-menu').forEach(el => {
                                                        el.classList.add('hidden');
                                                        el.classList.remove('flex');
                                                     });
                                                     if (isHidden) {
                                                        actions.classList.remove('hidden');
                                                        actions.classList.add('flex');
                                                     }
                                                  }
                                               }
                                            }}
                                            className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full min-w-0 break-words flex flex-col gap-0.5 cursor-pointer md:cursor-default",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm")}>
                                            {editingMessageId === msg.id ? (
                                               <div className="flex flex-col gap-2 min-w-[200px]">
                                                  <input autoFocus type="text" value={editMessageText} onChange={(e) => setEditMessageText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSaveEdit(msg.id); if(e.key === 'Escape') setEditingMessageId(null); }} className="w-full bg-black/10 text-white placeholder-white/50 border border-white/20 rounded-xl px-2 py-1 text-sm focus:outline-none" />
                                                  <div className="flex items-center justify-end gap-2 text-xs">
                                                     <button onClick={() => setEditingMessageId(null)} className="text-white/70 hover:text-white">Cancel</button>
                                                     <button onClick={() => handleSaveEdit(msg.id)} className="font-bold text-white">Save</button>
                                                  </div>
                                               </div>
                                            ) : (
                                               <>
                                                  {msg.isDeleted && !isMe && (
                                                     <div className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit border border-red-100">
                                                       <ShieldAlert className="w-3 h-3" />
                                                       This message was deleted by sender
                                                     </div>
                                                  )}
                                                  {msg.type === 'image' && msg.fileUrl && (
                                                     <div className="max-w-[240px] max-h-[300px] rounded-lg overflow-hidden my-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedImage(msg.fileUrl)}>
                                                        <img src={msg.fileUrl} alt="Uploaded image" className="w-full h-auto object-contain bg-black/5" />
                                                     </div>
                                                  )}
                                                  
                                                  {msg.type === 'meet' && msg.meetUri && (
                                                     <div className="my-2 border rounded-xl overflow-hidden bg-white shadow-sm">
                                                       <div className="bg-slate-50 border-b border-slate-100 p-3 flex flex-col items-center justify-center text-center">
                                                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                                            <Video className="w-6 h-6" />
                                                          </div>
                                                          <div className="font-bold text-slate-800 text-sm">Live Video Call</div>
                                                          <div className="text-xs text-slate-500">Tap to join this study session!</div>
                                                       </div>
                                                       <div className="p-2 bg-white">
                                                          <a href={msg.meetUri} target="_blank" rel="noreferrer" className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                                                            Join Meet
                                                          </a>
                                                       </div>
                                                     </div>
                                                  )}
                                                  {msg.type === 'file' && msg.fileUrl && (
                                                     <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={cn("flex items-center gap-2 p-2 rounded-lg my-1 transition-colors", isMe ? "bg-white/10 hover:bg-white/20" : "bg-slate-50 hover:bg-slate-100")}>
                                                        <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Paperclip className="w-4 h-4" /></div>
                                                        <span className="text-sm font-medium truncate max-w-[150px]">{msg.fileName || "Download File"}</span>
                                                     </a>
                                                  )}
                                                  {msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all min-w-0 max-w-full" style={{ wordBreak: 'break-word' }}>{highlightToxicWords(msg.text, msg.toxicWords, isAdmin)}</div>}
                                                  <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>
                                                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                  </div>
                                               </>
                                            )}
                                         </div>
                                      </div>

                                      {/* Quick Actions (Hover/Tap) */}
                                      <div id={`actions-${msg.id}`} className={cn("hidden group-hover:flex mobile-action-menu items-center gap-1 absolute top-1/2 -translate-y-1/2 z-20", isMe ? "right-full mr-3" : "left-full ml-3")}>
                                         <button onClick={() => setReplyingTo(msg)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors" title="Reply">
                                            <Reply className="w-4 h-4" />
                                         </button>
                                         {isMe && msg.type !== 'image' && (
                                            <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.text); }} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors" title="Edit">
                                               <Pencil className="w-4 h-4" />
                                            </button>
                                         )}
                                         {(isMe || activeGroup.creatorId === user?.uid) && (
                                            <button onClick={() => handleDeleteMessage(msg.id)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                                               <Trash2 className="w-4 h-4" />
                                            </button>
                                         )}
                                         {!isMe && activeGroup.creatorId === user?.uid && (
                                            <button onClick={() => handlePinMessage(msg.id)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors" title="Pin">
                                               <Pin className="w-4 h-4" />
                                            </button>
                                         )}
                                      </div>
                                   </div>
                                </div>
                             )
                          })
                       )}
                       <div ref={chatEndRef} className="h-4" />
                    </div>
                    {showScrollBottom && (
                        <button 
                            onClick={scrollToBottom}
                            className="absolute bottom-20 right-4 md:right-8 w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-all z-20"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    )}

                    {/* Chat Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                       {replyingTo && (
                          <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-t-xl border-x border-t border-slate-100 -mb-2 relative z-0">
                             <div className="flex items-center gap-2 min-w-0">
                               <Reply className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                               <span className="text-xs font-bold text-slate-600 shrink-0">Replying to {replyingTo.userName}</span>
                               <span className="text-xs text-slate-500 truncate">{replyingTo.text}</span>
                             </div>
                             <button onClick={() => setReplyingTo(null)} className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                               <X className="w-3.5 h-3.5" />
                             </button>
                          </div>
                       )}
                       {activeGroup.isBlocked ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700">
                          <Lock className="w-6 h-6 mb-2 text-amber-500" />
                          <p className="text-sm font-bold text-center">This group is temporarily restricted by Admin.</p>
                          <p className="text-xs text-center opacity-80 mt-1">Messaging is currently disabled.</p>
                        </div>
                       ) : (
                       <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">
                          <div className="flex items-center gap-1 shrink-0 pb-1">
                             <label className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors cursor-pointer">
                                <Paperclip className="w-5 h-5" />
                                <input type="file" accept="*/*" onChange={handleFileUpload} className="hidden" />
                             </label>
                             <label className="hidden sm:flex w-10 h-10 rounded-full hover:bg-slate-100 items-center justify-center text-slate-400 transition-colors cursor-pointer">
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                             </label>
                          </div>
                          
                          <div className="flex-1 bg-slate-50 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 rounded-2xl transition-all overflow-hidden">
                             <textarea 
                               value={newMessage}
                               onChange={handleInputChange}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   handleSendMessage(e);
                                 }
                               }}
                               placeholder="Type a message..."
                               className="w-full bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[15px] min-h-[48px] max-h-[120px]"
                               rows={1}
                             />
                          </div>
                          
                          <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95 mb-0.5">
                             <Send className="w-5 h-5 ml-0.5" />
                          </button>
                       </form>
                       )}
                    </div>
                 </div>
              )}

              {/* MEMBERS TAB */}
              {activeGroupTab === 'members' && (
                 <div className="p-4 md:p-8 overflow-y-auto animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                       <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                         <Users className="w-5 h-5 text-blue-500" /> Room Members
                         <div className="bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full text-xs ml-2">
                            {groupMembers.length}
                         </div>
                       </h3>
                       
                       {activeGroup.creatorId === user?.uid && (
                         <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 mt-2 sm:mt-0">
                            <span className="text-xs font-bold text-slate-500">Join Code:</span>
                            <span className="font-mono font-black text-blue-600 text-sm tracking-wider">{activeGroup.shortCode}</span>
                            <button onClick={() => {
                               navigator.clipboard.writeText(activeGroup.shortCode);
                               toast.success("Code copied!");
                            }} className="ml-2 bg-white w-6 h-6 rounded-md flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                               <Copy className="w-3.5 h-3.5" />
                            </button>
                         </div>
                       )}
                    </div>
                    
                    <div className="space-y-3">
                       {groupMembers
                          
                          .sort((a:any, b:any) => {
                             if (a.id === activeGroup.creatorId) return -1;
                             if (b.id === activeGroup.creatorId) return 1;
                             return (a.fullName || a.userName || "").localeCompare(b.fullName || b.userName || "");
                          })
                          .map((s: any) => {
                          const isMe = s.id === user?.uid;
                          const totalSessionTime = getSessionTime(s);
                          return (
                             <div key={s.id} onClick={() => handleUserClick(s.id)} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group">
                                <div className="relative shrink-0">
                                   <div className="w-14 h-14 rounded-full overflow-hidden shadow-sm border-2 border-white bg-slate-100">
                                      {(s.photoURL || s.userPhoto) ? <img src={s.photoURL || s.userPhoto} alt={s.fullName || s.userName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xl">{getFirstName(s.fullName || s.userName || "U").charAt(0).toUpperCase()}</div>}
                                   </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-slate-800 truncate text-[16px] group-hover:text-blue-600 transition-colors">{s.fullName || s.userName || "Unknown User"}</span>
                                      {isMe && <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-100">You</span>}
                                   </div>
                                </div>
                                {!isMe && activeGroup.creatorId === user?.uid && (
                                   <button className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0" onClick={(e) => {
                                      e.stopPropagation();
                                      handleKickMember(s.id, s.fullName || s.userName || "User");
                                   }} title="Remove Member">
                                      <LogOut className="w-4 h-4" />
                                   </button>
                                )}
                             </div>
                          )
                       })}
                    </div>
                 </div>
              )}
           </div>

           {/* MOBILE BOTTOM NAVIGATION */}
           <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-100 p-2 shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <button onClick={() => setActiveGroupTab('chat')} className={cn("flex flex-col items-center gap-1 p-2 flex-1 transition-colors relative", activeGroupTab === 'chat' ? "text-blue-600" : "text-slate-400")}>
                 <MessageSquare className={cn("w-5 h-5", activeGroupTab === 'chat' && "fill-blue-600/20")} />
                 <span className="text-[10px] font-bold">Chat</span>
              </button>
              <button onClick={() => setActiveGroupTab('members')} className={cn("flex flex-col items-center gap-1 p-2 flex-1 transition-colors", activeGroupTab === 'members' ? "text-blue-600" : "text-slate-400")}>
                 <Users className={cn("w-5 h-5", activeGroupTab === 'members' && "fill-blue-600/20")} />
                 <span className="text-[10px] font-bold">Members</span>
              </button>
           </div>
           
        </div>
        
        {/* Full Screen Image Viewer */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
             <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors border border-white/20">
                <X className="w-6 h-6" />
             </button>
             <img src={selectedImage} alt="Expanded" className="max-w-full max-h-full object-contain drop-shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-3">
             <Users className="w-5 h-5 text-blue-600" />
          </div>
          Study with Friends
        </h2>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed mb-8">
          <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-300">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">No active groups</h3>
          <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto">Create a private room to study with your friends, share goals, and track screen time together.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {groups.map(g => (
            <div key={g.id} onClick={() => setActiveGroup(g)} className="bg-white border border-slate-200 rounded-[20px] p-5 cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                   {g.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate text-lg group-hover:text-blue-600 transition-colors">{g.name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {g.members?.length || 1} members</div>
                 </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                 {g.creatorId === user?.uid && (
                   <div className="text-[11px] font-mono font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                     Code: {g.shortCode}
                   </div>
                 )}
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-8">
        <div className="flex-1">
          {hasCreatedGroup ? (
            <div className="w-full text-center py-3.5 px-4 bg-slate-50 text-slate-400 rounded-xl font-medium text-sm border border-slate-100 h-[52px] flex items-center justify-center">
              You have an active group
            </div>
          ) : !isCreating ? (
            <button onClick={() => setIsCreating(true)} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 h-[52px]">
              <Plus className="w-5 h-5" /> Create Room
            </button>
          ) : (
            <div className="flex gap-2 h-[52px]">
              <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Room Name..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-medium placeholder:text-slate-400" />
              <button onClick={handleCreateGroup} disabled={!createName.trim()} className="px-5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">Create</button>
              <button onClick={() => setIsCreating(false)} className="px-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          {!isJoining ? (
            <button onClick={() => setIsJoining(true)} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all active:scale-95 h-[52px]">
              <KeyRound className="w-5 h-5 text-slate-400" /> Join via Code
            </button>
          ) : (
            <div className="flex gap-2 h-[52px]">
              <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Code (e.g. GC-XYZ)" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:normal-case placeholder:font-sans placeholder:font-medium placeholder:text-slate-400" />
              <button onClick={handleJoinGroup} disabled={!joinCode.trim()} className="px-5 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-900 transition-colors disabled:opacity-50">Join</button>
              <button onClick={() => setIsJoining(false)} className="px-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

