const fs = require('fs');

let file = 'src/components/CommentsModal.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state for sendAsChulbul
const targetState = `const [newComment, setNewComment] = useState('');`;
const replaceState = `const [newComment, setNewComment] = useState('');\n  const [sendAsChulbul, setSendAsChulbul] = useState(false);`;
if (code.includes(targetState) && !code.includes('setSendAsChulbul')) {
  code = code.replace(targetState, replaceState);
}

// 2. Modify handleSubmit to handle sendAsChulbul
const targetSubmit = `const newCommentData: any = {
        isToxic: isToxic,
        toxicWords: toxicWordsFound,
        text: newComment.trim(),
        authorId: user.uid,`;
        
const replaceSubmit = `const newCommentData: any = {
        isToxic: isToxic,
        toxicWords: toxicWordsFound,
        text: newComment.trim(),
        authorId: sendAsChulbul ? 'inspector-chulbul-bot' : user.uid,`;

if (code.includes(targetSubmit)) {
  code = code.replace(targetSubmit, replaceSubmit);
}

const targetAutoWarning = `if (isToxic) {
        const warningComment = {`;
const replaceAutoWarning = `if (isToxic && !sendAsChulbul) {
        const warningComment = {`;

if (code.includes(targetAutoWarning)) {
  code = code.replace(targetAutoWarning, replaceAutoWarning);
}

const targetSetNewComment = `setNewComment('');`;
const replaceSetNewComment = `setNewComment('');\n      setSendAsChulbul(false);`;
if (code.includes(targetSetNewComment) && !code.includes('setSendAsChulbul(false)')) {
  code = code.replace(targetSetNewComment, replaceSetNewComment);
}

// 3. Add checkbox in UI
const targetUI = `<div className="px-3 pb-2 flex items-center justify-between">`;
const replaceUI = `<div className="px-3 pb-2 flex items-center justify-between">
                    {profile?.role === 'admin' && (
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200">
                        <input type="checkbox" checked={sendAsChulbul} onChange={(e) => setSendAsChulbul(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                        <ShieldAlert className="w-3 h-3" />
                        Send as Chulbul
                      </label>
                    )}`;

if (code.includes(targetUI) && !code.includes('Send as Chulbul')) {
  code = code.replace(targetUI, replaceUI);
}

fs.writeFileSync(file, code);
console.log("Patched CommentsModal for manual Chulbul send");
