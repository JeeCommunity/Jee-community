import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

func_target = """  const handleDeleteMessage = async (msgId: string) => {"""
func_replacement = """  const handleSaveEdit = async (msgId: string) => {
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

  const handleDeleteMessage = async (msgId: string) => {"""

if func_target in content:
    content = content.replace(func_target, func_replacement)


ui_target = """                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm")}>
                                            <div className="leading-relaxed">{msg.text}</div>
                                            <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                         </div>"""

ui_replacement = """                                         <div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5",
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
                                                  <div className="leading-relaxed">{msg.text}</div>
                                                  <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>
                                                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                  </div>
                                               </>
                                            )}
                                         </div>"""

if ui_target in content:
    content = content.replace(ui_target, ui_replacement)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
