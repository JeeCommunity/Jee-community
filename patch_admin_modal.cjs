const fs = require('fs');
const file = 'src/components/AdminStudyGroupModal.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `            messages.map((msg) => (
              <div key={msg.id} className={\`p-3 rounded-xl border shadow-sm max-w-[85%] \${msg.isToxic ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} \${msg.userId === 'inspector-chulbul-bot' ? 'bg-red-50/50 border-red-200 self-center max-w-[95%] shadow-md' : ''}\`}>`;

const replacement = `            messages.map((msg) => {
              if (msg.userId === 'inspector-chulbul-bot') {
                return (
                 <div key={msg.id} className="flex flex-col w-full my-4">
                   <div className="flex items-end gap-2 group relative w-full px-2">
                     <div className="w-14 h-14 shrink-0 relative z-20 animate-[bounce_3s_ease-in-out_infinite] -mb-2">
                       <img src={msg.userPhoto} alt="Chulbul" className="w-full h-full object-contain drop-shadow-xl" />
                     </div>
                     <div className="bg-red-50 border-2 border-red-300 text-red-900 px-4 py-3 rounded-2xl rounded-bl-none shadow-lg z-10 flex-1 relative animate-[pulse_4s_ease-in-out_infinite]">
                       <div className="absolute -left-2 bottom-0 w-4 h-4 bg-red-50 border-l-2 border-b-2 border-red-300 transform -rotate-45 translate-y-0.5 rounded-bl-sm z-[-1]"></div>
                       <span className="font-black text-red-700 block mb-1 text-sm">{msg.userName}</span>
                       {msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all text-[14px] font-bold" style={{ wordBreak: 'break-word' }}>{msg.text}</div>}
                       <div className="text-[10px] text-right font-bold text-red-500/70 mt-1">
                           {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                       </div>
                     </div>
                   </div>
                 </div>
                );
              }

              return (
              <div key={msg.id} className={\`p-3 rounded-xl border shadow-sm max-w-[85%] \${msg.isToxic ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}\`}>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  // Also need to close the curly brace at the end of map
  const endTarget = `              </div>
            ))`;
  const endReplacement = `              </div>
            )})`;
  code = code.replace(endTarget, endReplacement);
  fs.writeFileSync(file, code);
  console.log("Patched AdminStudyGroupModal!");
} else {
  console.log("Target not found");
}
