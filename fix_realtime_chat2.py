import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Fix bubble
content = re.sub(
    r'<div className=\{cn\("px-4 py-2\.5 rounded-\[20px\] relative z-10 shadow-sm leading-relaxed text-\[15px\] max-w-full break-words",\s*isMe \? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"\)\}>\s*\{msg\.text\}\s*</div>',
    """<div className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5",
                                             isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm")}>
                                            <div className="leading-relaxed">{msg.text}</div>
                                            <div className={cn("text-[9px] text-right font-medium -mb-1 mt-0.5", isMe ? "text-blue-200" : "text-slate-400")}>
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                         </div>""",
    content
)

# Fix typing indicator bottom
content = re.sub(
    r'\}\)\s*\)\}\s*<div ref=\{chatEndRef\} />',
    """})
                       )}
                       {typingUsers.length > 0 && (
                          <div className="flex flex-col w-full max-w-[85%] mr-auto items-start">
                             <div className="flex items-end gap-2 max-w-full">
                                <div className="w-8 shrink-0"></div>
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2 shadow-sm relative overflow-hidden h-[38px]">
                                   <div className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                   </div>
                                   <span className="text-[10px] font-bold text-slate-400 ml-1">
                                      {typingUsers.length === 1 ? `${typingUsers[0].name} is typing...` : `${typingUsers.length} people are typing...`}
                                   </span>
                                </div>
                             </div>
                          </div>
                       )}
                       <div ref={chatEndRef} />""",
    content
)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

