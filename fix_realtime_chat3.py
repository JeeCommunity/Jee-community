import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Fix typing indicator bottom
content = re.sub(
    r'\}\s*\)\s*\}\s*<div ref=\{chatEndRef\} />',
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

