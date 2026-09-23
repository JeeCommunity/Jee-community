with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

old_block = """{/* Reply Context */}
                                         {msg.replyToId && (
                                            <div className={cn("bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs border border-slate-200/50 mb-[-10px] relative z-0 flex items-center gap-1.5 max-w-full", isMe ? "mr-2 pr-6" : "ml-2 pl-6")}>
                                               <Reply className="w-3 h-3 text-slate-400 shrink-0" />
                                               <span className="font-bold text-slate-600 shrink-0">{msg.replyToUser}:</span>
                                               <span className="text-slate-500 truncate">{msg.replyToText}</span>
                                            </div>
                                         )}"""

new_block = """{/* Reply Context */}
                                         {msg.replyToId && (
                                            <div className={cn("bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs border border-slate-200/50 mb-[-10px] relative z-0 flex items-center gap-1.5 max-w-full min-w-0", isMe ? "mr-2 pr-6" : "ml-2 pl-6")}>
                                               <Reply className="w-3 h-3 text-slate-400 shrink-0" />
                                               <span className="font-bold text-slate-600 shrink-0 max-w-[100px] truncate">{msg.replyToUser}:</span>
                                               <span className="text-slate-500 truncate min-w-0 flex-1">{msg.replyToText}</span>
                                            </div>
                                         )}"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("src/components/PrivateStudyGroups.tsx", "w") as f:
        f.write(content)
    print("Patched!")
else:
    print("Not found!")
