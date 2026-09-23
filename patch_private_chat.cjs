const fs = require('fs');
const file = 'src/components/PrivateStudyGroups.tsx';
let code = fs.readFileSync(file, 'utf8');

const botStyleTarget = `const isMe = msg.userId === user?.uid;`;
const botStyleReplacement = `const isMe = msg.userId === user?.uid;
                                            const isBot = msg.userId === 'inspector-chulbul-bot';`;
if (code.includes(botStyleTarget)) {
  code = code.replace(botStyleTarget, botStyleReplacement);
}

const msgContainerTarget = `className={cn("max-w-[75%] rounded-2xl relative group", isMe ? "bg-blue-600 text-white" : "bg-white border border-slate-100 shadow-sm text-slate-700")}`;
const msgContainerReplacement = `className={cn("max-w-[75%] rounded-2xl relative group", isMe ? "bg-blue-600 text-white" : isBot ? "bg-red-50 border-2 border-red-200 text-red-900 w-full max-w-[90%] shadow-md" : "bg-white border border-slate-100 shadow-sm text-slate-700")}`;
if (code.includes(msgContainerTarget)) {
  code = code.replace(msgContainerTarget, msgContainerReplacement);
}

const botNameTarget = `<span className="font-bold text-slate-900">{msg.userName}</span>`;
const botNameReplacement = `<span className={cn("font-bold", isBot ? "text-red-700" : "text-slate-900")}>{msg.userName}</span>`;
if (code.includes(botNameTarget)) {
  code = code.replace(botNameTarget, botNameReplacement);
}

fs.writeFileSync(file, code);
console.log("Patched PrivateStudyGroups bot style");
