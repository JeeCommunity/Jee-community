import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
if 'import { motion }' not in content:
    content = content.replace(
        "import { cn, getFirstName } from '../lib/utils';",
        "import { cn, getFirstName } from '../lib/utils';\nimport { motion } from 'motion/react';"
    )

if 'Trash2' not in content:
    content = content.replace(
        "Settings, Pencil } from 'lucide-react';",
        "Settings, Pencil, Trash2 } from 'lucide-react';"
    )

# 2. Add state and functions
new_state_and_funcs = """  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeGroup || !user) return;
    try {
      await deleteDoc(doc(db, 'study_groups', activeGroup.id, 'messages', msgId));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleUpdateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !user || !editingMessageId || !editMessageText.trim()) return;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.id, 'messages', editingMessageId), {
        text: editMessageText,
        isEdited: true
      });
      setEditingMessageId(null);
      setEditMessageText("");
      toast.success("Message updated");
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  const handleDragEnd = (event: any, info: any, msg: any, isMe: boolean) => {
     const threshold = 50;
     if (isMe && info.offset.x < -threshold) {
         setReplyingTo(msg);
     } else if (!isMe && info.offset.x > threshold) {
         setReplyingTo(msg);
     }
  };"""

content = re.sub(r'  const \[typingUsers, setTypingUsers\] = useState.*?;', 
                 lambda m: m.group(0) + '\n' + new_state_and_funcs, 
                 content, count=1)

# 3. Update Username rendering
old_username = """                                   {/* Username (only if not me and different from previous) */}
                                   {!isMe && showAvatar && (
                                      <span className="text-[11px] font-bold text-slate-400 ml-12 mb-1 pl-1">{msg.userName}</span>
                                   )}"""
new_username = """                                   {/* Username (only if different from previous) */}
                                   {showAvatar && (
                                      <span className={cn("text-[11px] font-bold mb-1 px-1", isMe ? "mr-2 text-blue-400" : "ml-12 text-slate-400")}>{isMe ? "You" : msg.userName}</span>
                                   )}"""
content = content.replace(old_username, new_username)

# 4. Wrap Bubble with motion.div and add inline edit
old_bubble_full = """                                         {/* Bubble */}
                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm",
                                             msg.type === 'image' ? 'p-1.5' : '')}>
                                            {msg.type === 'image' && msg.imageUrl ? (
                                                <div className="relative rounded-2xl overflow-hidden bg-black/5">
                                                    <img src={msg.imageUrl} alt="Shared image" className="max-w-[240px] md:max-w-xs max-h-64 object-contain rounded-2xl" />
                                                </div>
                                            ) : null}
                                            {msg.text && <div className={cn("leading-relaxed", msg.type === 'image' && 'px-2 pt-1.5 pb-1')}>{msg.text}</div>}
                                            <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400", msg.type === 'image' && !msg.text ? 'px-2 pb-1 bg-gradient-to-t from-black/50 to-transparent absolute bottom-1.5 right-1.5 text-white/90 rounded-bl-md rounded-br-md !mb-0' : '')}>
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                         </div>"""

new_bubble_full = """                                         {/* Bubble */}
                                         <motion.div 
                                            drag="x" 
                                            dragConstraints={{ left: 0, right: 0 }} 
                                            dragElastic={0.1}
                                            onDragEnd={(e, info) => handleDragEnd(e, info, msg, isMe)}
                                            className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5 touch-pan-y",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm",
                                             msg.type === 'image' ? 'p-1.5' : '')}>
                                            
                                            {editingMessageId === msg.id ? (
                                               <form onSubmit={handleUpdateMessage} className="flex flex-col gap-2 min-w-[200px]">
                                                  <input 
                                                     autoFocus
                                                     type="text" 
                                                     value={editMessageText}
                                                     onChange={(e) => setEditMessageText(e.target.value)}
                                                     className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-white"
                                                  />
                                                  <div className="flex items-center justify-end gap-2 text-xs">
                                                     <button type="button" onClick={() => setEditingMessageId(null)} className="text-white/70 hover:text-white">Cancel</button>
                                                     <button type="submit" className="font-bold text-white">Save</button>
                                                  </div>
                                               </form>
                                            ) : (
                                               <>
                                                  {msg.type === 'image' && msg.imageUrl ? (
                                                      <div className="relative rounded-2xl overflow-hidden bg-black/5">
                                                          <img src={msg.imageUrl} alt="Shared image" className="max-w-[240px] md:max-w-xs max-h-64 object-contain rounded-2xl" />
                                                      </div>
                                                  ) : null}
                                                  {msg.text && <div className={cn("leading-relaxed", msg.type === 'image' && 'px-2 pt-1.5 pb-1')}>{msg.text}</div>}
                                                  <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5 flex items-center justify-end gap-1", isMe ? "text-blue-200" : "text-slate-400", msg.type === 'image' && !msg.text ? 'px-2 pb-1 bg-gradient-to-t from-black/50 to-transparent absolute bottom-1.5 right-1.5 text-white/90 rounded-bl-md rounded-br-md !mb-0' : '')}>
                                                      {msg.isEdited && <span className="mr-1 italic opacity-70">edited</span>}
                                                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                  </div>
                                               </>
                                            )}
                                         </motion.div>"""
content = content.replace(old_bubble_full, new_bubble_full)

# 5. Add Quick Actions
old_quick_actions = """                                      {/* Quick Actions (Hover) */}
                                      <div className={cn("hidden group-hover:flex items-center gap-1 absolute top-1/2 -translate-y-1/2", isMe ? "right-full mr-3" : "left-full ml-3")}>
                                         <button onClick={() => setReplyingTo(msg)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
                                            <Reply className="w-4 h-4" />
                                         </button>
                                         {!isMe && activeGroup.creatorId === user?.uid && (
                                            <button onClick={() => handlePinMessage(msg.id)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors">
                                               <Pin className="w-4 h-4" />
                                            </button>
                                         )}
                                      </div>"""

new_quick_actions = """                                      {/* Quick Actions (Hover) */}
                                      <div className={cn("hidden group-hover:flex items-center gap-1 absolute top-1/2 -translate-y-1/2 z-20", isMe ? "right-full mr-3" : "left-full ml-3")}>
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
                                      </div>"""
content = content.replace(old_quick_actions, new_quick_actions)


with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
