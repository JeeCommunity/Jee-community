import os

code = """import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Pin, Reply, X, Clock, Play } from 'lucide-react';
import { cn, getFirstName } from '../lib/utils';
import toast from 'react-hot-toast';

interface PrivateStudyGroupsProps {
  sessions: any[];
  usersData: Record<string, any>;
  getSessionTime: (s: any) => number;
  formatTime: (totalSeconds: number) => string;
  handleUserClick: (userId: string) => void;
}

export default function PrivateStudyGroups({ sessions, usersData, getSessionTime, formatTime, handleUserClick }: PrivateStudyGroupsProps) {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  
  // Navigation inside group
  const [activeGroupTab, setActiveGroupTab] = useState<"home" | "chat" | "members">("home");

  // Forms
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Listen to chat messages if activeGroup exists
  useEffect(() => {
    if (!activeGroup || !user) return;
    
    const q = query(
      collection(db, 'study_groups', activeGroup.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    
    return () => unsub();
  }, [activeGroup, user]);

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

  const handleLeaveGroup = async (groupId: string) => {
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup || !user || !profile) return;
    
    try {
      await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
        text: newMessage.trim(),
        userId: user.uid,
        userName: profile.fullName || profile.username || "Unknown",
        userPhoto: profile.photoURL || null,
        createdAt: serverTimestamp(),
        replyToId: replyingTo?.id || null,
        replyToText: replyingTo?.text || null,
        replyToUser: replyingTo?.userName || null,
        type: 'text' // could be image, pdf in future
      });
      setNewMessage("");
      setReplyingTo(null);
    } catch (e) {
      toast.error("Error sending message");
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
  
  const handleFileClick = () => {
     toast("File uploads require Firebase Storage configuration.", { icon: '📎' });
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  const hasCreatedGroup = groups.some(g => g.creatorId === user?.uid);

  if (activeGroup) {
    const groupMembers = activeGroup.members.map((memberId: string) => {
      const session = sessions.find((s: any) => s.id === memberId) || { id: memberId, isStudying: false, goals: [] };
      const uData = usersData[memberId] || {};
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
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[600px] h-[calc(100vh-140px)] max-h-[800px]">
        
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex flex-col w-64 bg-slate-50 border-r border-slate-100 p-4 shrink-0">
          <button onClick={() => setActiveGroup(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm mb-6 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </button>
          
          <div className="flex items-center gap-3 px-2 mb-8">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
               {activeGroup.name.charAt(0).toUpperCase()}
             </div>
             <div className="min-w-0">
               <h2 className="font-bold text-slate-800 truncate leading-tight">{activeGroup.name}</h2>
               <div className="text-xs text-slate-500 font-medium">{groupMembers.length} members</div>
             </div>
          </div>
          
          <nav className="flex flex-col gap-1.5 flex-1">
             <button onClick={() => setActiveGroupTab('home')} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all", activeGroupTab === 'home' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
               <Home className="w-4 h-4" /> Home
             </button>
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
        <div className="flex-1 flex flex-col min-w-0 relative bg-white">
           
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
           </div>

           {/* SCROLLABLE CONTENT */}
           <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
              
              {/* HOME TAB */}
              {activeGroupTab === 'home' && (
                 <div className="p-4 md:p-8 animate-in fade-in duration-300">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-[24px] border border-slate-100 mb-8 text-center relative overflow-hidden">
                       <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/40 shadow-sm cursor-pointer hover:bg-white transition-colors" onClick={() => {
                          navigator.clipboard.writeText(activeGroup.shortCode);
                          toast.success("Join code copied!");
                       }}>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code</span>
                          <span className="font-mono text-xs font-bold text-blue-600">{activeGroup.shortCode}</span>
                          <Copy className="w-3 h-3 text-slate-400" />
                       </div>
                       
                       <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/20 mb-5 relative">
                         {activeGroup.name.charAt(0).toUpperCase()}
                         <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm border border-slate-100">
                            <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></div>
                         </div>
                       </div>
                       <h1 className="text-2xl font-black text-slate-800 mb-2">{activeGroup.name}</h1>
                       <p className="text-slate-500 font-medium text-sm flex items-center gap-4">
                          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {groupMembers.length} Members</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="flex items-center gap-1.5 text-green-600"><div className="w-2 h-2 rounded-full bg-green-500"></div> {onlineMembers.length} Online</span>
                       </p>
                    </div>

                    {/* Invite Banner for empty/new groups */}
                    {groupMembers.length <= 1 && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center mb-8 flex flex-col items-center">
                        <div className="w-12 h-12 bg-white text-blue-500 rounded-full flex items-center justify-center shadow-sm mb-4">
                          <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-slate-800 font-bold mb-2">Invite your friends!</h3>
                        <p className="text-slate-500 text-sm mb-5 max-w-sm">Share this code with your friends on WhatsApp or Discord so they can join your room.</p>
                        <div className="flex items-center justify-center gap-2 w-full max-w-xs">
                          <div className="flex-1 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-mono font-bold text-slate-700 tracking-wider">
                            {activeGroup.shortCode}
                          </div>
                          <button onClick={() => {
                            navigator.clipboard.writeText(activeGroup.shortCode);
                            toast.success("Code copied!");
                          }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md shadow-blue-500/20 active:scale-95">
                            <Copy className="w-4 h-4" /> Copy
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Recent Activity (Mini Leaderboard) */}
                    <div>
                       <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                         <Clock className="w-4 h-4 text-slate-400" /> Recent Activity
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {groupMembers.filter((m: any) => m.isStudying || getSessionTime(m) > 0).slice(0,4).map((s: any) => (
                             <div key={s.id} onClick={() => s.id !== user?.uid && handleUserClick(s.id)} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group">
                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                                  {(s.photoURL || s.userPhoto) ? <img src={s.photoURL || s.userPhoto} alt={s.fullName || s.userName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-sm">{getFirstName(s.fullName || s.userName || "U").charAt(0).toUpperCase()}</div>}
                                  {s.isStudying && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{s.fullName || s.userName || "Unknown"}</div>
                                   {s.isStudying && s.activeGoalId && s.goals ? (
                                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                        {s.goals.find((g: any) => g.id === s.activeGoalId)?.text || "Studying"}
                                      </div>
                                   ) : (
                                      <div className="text-[11px] text-slate-400 mt-0.5">Offline</div>
                                   )}
                                </div>
                                <div className="text-right shrink-0">
                                   <div className="font-mono font-bold text-slate-700 text-sm">{formatTime(getSessionTime(s))}</div>
                                </div>
                             </div>
                          ))}
                          {groupMembers.filter((m: any) => m.isStudying || getSessionTime(m) > 0).length === 0 && (
                             <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400 text-sm font-medium">
                                No recent activity today.
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              )}

              {/* CHAT TAB */}
              {activeGroupTab === 'chat' && (
                 <div className="flex flex-col h-full bg-slate-50/50">
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
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
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
                             const showAvatar = idx === 0 || messages[idx-1].userId !== msg.userId;
                             
                             return (
                                <div key={msg.id} className={cn("flex flex-col w-full max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                   {/* Username (only if not me and different from previous) */}
                                   {!isMe && showAvatar && (
                                      <span className="text-[11px] font-bold text-slate-400 ml-12 mb-1 pl-1">{msg.userName}</span>
                                   )}
                                   
                                   <div className="flex items-end gap-2 group relative max-w-full">
                                      
                                      {!isMe && showAvatar ? (
                                         <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-white shadow-sm mb-1">
                                            {msg.userPhoto ? <img src={msg.userPhoto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{msg.userName.charAt(0).toUpperCase()}</div>}
                                         </div>
                                      ) : !isMe ? (
                                         <div className="w-8 shrink-0"></div>
                                      ) : null}

                                      {/* Message Bubble container */}
                                      <div className={cn("flex flex-col gap-1 relative", isMe ? "items-end" : "items-start")}>
                                         
                                         {/* Reply Context */}
                                         {msg.replyToId && (
                                            <div className={cn("bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs border border-slate-200/50 mb-[-10px] relative z-0 flex items-center gap-1.5 max-w-full", isMe ? "mr-2 pr-6" : "ml-2 pl-6")}>
                                               <Reply className="w-3 h-3 text-slate-400 shrink-0" />
                                               <span className="font-bold text-slate-600 shrink-0">{msg.replyToUser}:</span>
                                               <span className="text-slate-500 truncate">{msg.replyToText}</span>
                                            </div>
                                         )}

                                         {/* Bubble */}
                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm leading-relaxed text-[15px] max-w-full break-words", 
                                            isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm")}>
                                            {msg.text}
                                         </div>
                                      </div>

                                      {/* Quick Actions (Hover) */}
                                      <div className={cn("hidden group-hover:flex items-center gap-1 absolute top-1/2 -translate-y-1/2", isMe ? "right-full mr-3" : "left-full ml-3")}>
                                         <button onClick={() => setReplyingTo(msg)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
                                            <Reply className="w-4 h-4" />
                                         </button>
                                         {!isMe && activeGroup.creatorId === user?.uid && (
                                            <button onClick={() => handlePinMessage(msg.id)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors">
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

                    {/* Chat Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-safe">
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
                       <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">
                          <div className="flex items-center gap-1 shrink-0 pb-1">
                             <button type="button" onClick={handleFileClick} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <Paperclip className="w-5 h-5" />
                             </button>
                             <button type="button" onClick={handleFileClick} className="hidden sm:flex w-10 h-10 rounded-full hover:bg-slate-100 items-center justify-center text-slate-400 transition-colors">
                                <ImageIcon className="w-5 h-5" />
                             </button>
                          </div>
                          
                          <div className="flex-1 bg-slate-50 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 rounded-2xl transition-all overflow-hidden">
                             <textarea 
                               value={newMessage}
                               onChange={(e) => setNewMessage(e.target.value)}
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
                    </div>
                 </div>
              )}

              {/* MEMBERS TAB */}
              {activeGroupTab === 'members' && (
                 <div className="p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                         <Users className="w-5 h-5 text-blue-500" /> Room Members
                       </h3>
                       <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs">
                          {groupMembers.length}
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       {groupMembers.sort((a:any, b:any) => getSessionTime(b) - getSessionTime(a)).map((s: any) => {
                          const isMe = s.id === user?.uid;
                          const totalSessionTime = getSessionTime(s);
                          return (
                             <div key={s.id} onClick={() => !isMe && handleUserClick(s.id)} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group">
                                <div className="relative shrink-0">
                                   <div className="w-14 h-14 rounded-full overflow-hidden shadow-sm border-2 border-white bg-slate-100">
                                      {(s.photoURL || s.userPhoto) ? <img src={s.photoURL || s.userPhoto} alt={s.fullName || s.userName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xl">{getFirstName(s.fullName || s.userName || "U").charAt(0).toUpperCase()}</div>}
                                   </div>
                                   {s.isStudying ? (
                                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
                                   ) : (
                                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-slate-300 border-2 border-white rounded-full shadow-sm"></div>
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-slate-800 truncate text-[16px] group-hover:text-blue-600 transition-colors">{s.fullName || s.userName || "Unknown User"}</span>
                                      {isMe && <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-100">You</span>}
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                         <Clock className="w-3.5 h-3.5" /> {formatTime(totalSessionTime)} today
                                      </div>
                                   </div>
                                </div>
                                {!isMe && activeGroup.creatorId === user?.uid && (
                                   <button className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0" onClick={(e) => {
                                      e.stopPropagation();
                                      toast.error("Kick member feature coming soon");
                                   }}>
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
           <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-100 p-2 pb-safe shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <button onClick={() => setActiveGroupTab('home')} className={cn("flex flex-col items-center gap-1 p-2 w-16 transition-colors", activeGroupTab === 'home' ? "text-blue-600" : "text-slate-400")}>
                 <Home className={cn("w-5 h-5", activeGroupTab === 'home' && "fill-blue-600/20")} />
                 <span className="text-[10px] font-bold">Home</span>
              </button>
              <button onClick={() => setActiveGroupTab('chat')} className={cn("flex flex-col items-center gap-1 p-2 w-16 transition-colors relative", activeGroupTab === 'chat' ? "text-blue-600" : "text-slate-400")}>
                 <MessageSquare className={cn("w-5 h-5", activeGroupTab === 'chat' && "fill-blue-600/20")} />
                 <span className="text-[10px] font-bold">Chat</span>
              </button>
              <button onClick={() => setActiveGroupTab('members')} className={cn("flex flex-col items-center gap-1 p-2 w-16 transition-colors", activeGroupTab === 'members' ? "text-blue-600" : "text-slate-400")}>
                 <Users className={cn("w-5 h-5", activeGroupTab === 'members' && "fill-blue-600/20")} />
                 <span className="text-[10px] font-bold">Members</span>
              </button>
           </div>
           
        </div>
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
                 <div className="text-[11px] font-mono font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                   {g.shortCode}
                 </div>
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
"""

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(code)

