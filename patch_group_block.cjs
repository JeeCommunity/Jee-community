const fs = require('fs');

let file = 'src/components/PrivateStudyGroups.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetFormStart = `<form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">`;

const replacement = `{activeGroup.isBlocked ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700">
                          <Lock className="w-6 h-6 mb-2 text-amber-500" />
                          <p className="text-sm font-bold text-center">This group is temporarily restricted by Admin.</p>
                          <p className="text-xs text-center opacity-80 mt-1">Messaging is currently disabled.</p>
                        </div>
                       ) : (
                       <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">`;

const targetFormEnd = `</button>
                       </form>`;
const replacementEnd = `</button>
                       </form>
                       )}`;

if (code.includes(targetFormStart) && !code.includes('activeGroup.isBlocked')) {
  let parts = code.split(targetFormStart);
  let subParts = parts[1].split(targetFormEnd);
  
  if (subParts.length >= 2) {
      code = parts[0] + replacement + subParts[0] + replacementEnd + subParts.slice(1).join(targetFormEnd);
      fs.writeFileSync(file, code);
      console.log("Patched form");
  }
}

// Ensure Lock is imported
const importTarget = `import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, ChevronDown, Pin, Reply, X, Clock, Play, Settings, Pencil, Trash2 } from 'lucide-react';`;
const importReplacement = `import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, ChevronDown, Pin, Reply, X, Clock, Play, Settings, Pencil, Trash2, Lock } from 'lucide-react';`;

if (code.includes(importTarget) && !code.includes('Lock }')) {
  code = code.replace(importTarget, importReplacement);
  fs.writeFileSync(file, code);
  console.log("Imported Lock");
}
