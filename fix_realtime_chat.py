import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Add useRef to React imports if missing
if 'useRef' not in content:
    content = content.replace('useState, useEffect', 'useState, useEffect, useRef')

# 1. Add typing users state and effect
typing_logic = """  const chatEndRef = useRef<HTMLDivElement>(null);

  const [typingUsers, setTypingUsers] = useState<{name: string, uid: string, timestamp: number}[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!activeGroup || !user) return;
    
    const interval = setInterval(() => {
        setTypingUsers(prev => prev.filter(t => Date.now() - t.timestamp < 3000));
    }, 1000);
    
    const q = query(collection(db, 'study_groups', activeGroup.id, 'typing'));
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const typing = snap.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as any))
        .filter(t => t.uid !== user.uid && now - t.timestamp < 4000)
        .map(t => ({ name: t.name, uid: t.uid, timestamp: t.timestamp }));
      setTypingUsers(typing);
    });
    
    return () => {
       unsub();
       clearInterval(interval);
       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
       deleteDoc(doc(db, 'study_groups', activeGroup.id, 'typing', user.uid)).catch(() => {});
    };
  }, [activeGroup, user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (activeGroup && user && profile) {
      setDoc(doc(db, 'study_groups', activeGroup.id, 'typing', user.uid), {
        name: profile.fullName || profile.username || "Unknown",
        timestamp: Date.now()
      }).catch(console.error);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        deleteDoc(doc(db, 'study_groups', activeGroup.id, 'typing', user.uid)).catch(console.error);
      }, 2000);
    }
  };
"""

content = content.replace("  const chatEndRef = useRef<HTMLDivElement>(null);", typing_logic)

# 2. Add time inside message bubbles
old_bubble = """                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm leading-relaxed text-[15px] max-w-full break-words",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm")}>
                                            {msg.text}
                                         </div>"""

new_bubble = """                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm")}>
                                            <div className="leading-relaxed">{msg.text}</div>
                                            <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                         </div>"""
content = content.replace(old_bubble, new_bubble)

# 3. Add typing indicator UI
old_messages_bottom = """                          })
                       )}
                       <div ref={chatEndRef} />"""

new_messages_bottom = """                          })
                       )}
                       {typingUsers.length > 0 && (
                          <div className="flex flex-col w-full max-w-[85%] mr-auto items-start">
                             <div className="flex items-end gap-2 max-w-full">
                                <div className="w-8 shrink-0"></div>
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2 shadow-sm relative overflow-hidden">
                                   <div className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                   </div>
                                   <span className="text-[10px] font-bold text-slate-400">
                                      {typingUsers.length === 1 ? `${typingUsers[0].name} is typing...` : `${typingUsers.length} people are typing...`}
                                   </span>
                                </div>
                             </div>
                          </div>
                       )}
                       <div ref={chatEndRef} />"""
content = content.replace(old_messages_bottom, new_messages_bottom)

# 4. Bind onChange for input
content = content.replace(
    'onChange={(e) => setNewMessage(e.target.value)}',
    'onChange={handleInputChange}'
)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

