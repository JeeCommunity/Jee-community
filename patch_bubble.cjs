const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // We are looking for the isBot block we inserted earlier.
  // We need a more generic target or regex to replace the entire if(isBot) block.
  
  const startTarget = `                             if (isBot) {`;
  const endTarget = `                             return (
                                <div key={msg.id} className={cn("flex flex-col max-w-[85%] min-w-0", isMe ? "ml-auto items-end" : "mr-auto items-start")}>`;

  if (code.includes(startTarget)) {
    const startIndex = code.indexOf(startTarget);
    const endIndex = code.indexOf(endTarget);
    if (startIndex !== -1 && endIndex !== -1) {
       const replacement = `                             if (isBot) {
                               return (
                                 <div key={msg.id} className="flex flex-col w-full my-6">
                                   <div className="flex items-start gap-3 md:gap-4 group relative w-full px-2">
                                     {/* Chulbul Animated Avatar */}
                                     <div className="w-24 md:w-32 shrink-0 relative z-20 animate-[bounce_2s_ease-in-out_infinite]">
                                       <img src={msg.userPhoto} alt="Chulbul" className="w-full h-auto object-contain drop-shadow-2xl" />
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

`;
       code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
       fs.writeFileSync(file, code);
       console.log("Patched " + file);
    }
  }
}

patchFile('src/components/PrivateStudyGroups.tsx');
