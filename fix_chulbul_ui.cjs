const fs = require('fs');

let file = 'src/components/CommentsModal.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetReturn = `return (
    <div className="flex space-x-3">`;

const replaceReturn = `
  if (comment.authorId === 'inspector-chulbul-bot') {
    return (
     <div className="flex flex-col w-full my-6">
       <div className="flex items-start gap-3 md:gap-4 group relative w-full px-2">
         <div className="w-16 md:w-20 shrink-0 relative z-20 animate-[bounce_2s_ease-in-out_infinite]">
           <img src="/chulbul.png" alt="Chulbul" className="w-full h-auto object-contain drop-shadow-xl" />
         </div>
         <div className="bg-white border-2 border-red-500 text-red-900 px-4 py-3 rounded-2xl shadow-xl z-10 flex-1 relative animate-[pulse_3s_ease-in-out_infinite] mt-1 md:mt-2">
           <div className="absolute -left-[9px] top-4 w-4 h-4 bg-white border-l-2 border-b-2 border-red-500 transform rotate-45 rounded-bl-sm z-10"></div>
           <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span className="font-black text-red-700 block text-sm uppercase tracking-wider">Inspector Chulbul 👮‍♂️</span>
           </div>
           {comment.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all text-[13px] font-bold text-slate-800" style={{ wordBreak: 'break-word' }}>{comment.text}</div>}
           <div className="flex justify-end mt-2">
             <button onClick={() => {if(canDelete) handleDelete();}} className="text-red-400 hover:text-red-600 text-xs flex items-center"><Trash className="w-3 h-3 mr-1"/> Delete</button>
           </div>
         </div>
       </div>
     </div>
    );
  }

  return (
    <div className="flex space-x-3">`;

if (code.includes(targetReturn) && !code.includes('if (comment.authorId === \'inspector-chulbul-bot\')')) {
  code = code.replace(targetReturn, replaceReturn);
}

fs.writeFileSync(file, code);
