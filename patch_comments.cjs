const fs = require('fs');

let file = 'src/components/CommentsModal.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('getToxicWords')) {
  code = code.replace(`import { useAuth } from '../AuthContext';`, `import { useAuth } from '../AuthContext';\nimport { getToxicWords } from '../lib/moderation';\nimport { ShieldAlert } from 'lucide-react';`);
}

// Add toxicity check in handleSubmit
const targetSubmit = `const newCommentData: any = {`;
const replaceSubmit = `
      const toxicWordsFound = getToxicWords(newComment.trim());
      const isToxic = toxicWordsFound.length > 0;
      
      const newCommentData: any = {
        isToxic: isToxic,
        toxicWords: toxicWordsFound,`;

if (code.includes(targetSubmit) && !code.includes('const isToxic = toxicWordsFound.length > 0;')) {
  code = code.replace(targetSubmit, replaceSubmit);
}

// Auto-add Chulbul warning if comment is toxic
const targetAddDoc = `await addDoc(collection(db, 'comments'), newCommentData);`;
const replaceAddDoc = `const commentDocRef = await addDoc(collection(db, 'comments'), newCommentData);
      
      if (isToxic) {
        const warningComment = {
          text: "Hello! Mera name Inspector Chulbul hai 👮‍♂️ aur mera kaam community ko manage karna. Is comment me harassment/spam ho raha hai. Ise stop karein varna account BAN ho jayega! 🚨",
          authorId: 'inspector-chulbul-bot',
          postId: post.id,
          createdAt: serverTimestamp(),
          parentId: commentDocRef.id, // reply to the toxic comment
          likesCount: 0,
          likedBy: [],
        };
        await addDoc(collection(db, 'comments'), warningComment);
        await updateDoc(doc(db, 'posts', post.id), {
          commentsCount: (post.commentsCount || 0) + 2 // +1 for comment, +1 for warning
        });
      } else {
        await updateDoc(doc(db, 'posts', post.id), {
          commentsCount: (post.commentsCount || 0) + 1
        });
      }`;

if (code.includes(targetAddDoc) && !code.includes('warningComment')) {
  code = code.replace(targetAddDoc, replaceAddDoc);
  
  // Remove the old commentsCount update since we do it in the if/else now
  const oldUpdate = `// Update the commentsCount on the post
      await updateDoc(doc(db, 'posts', post.id), {
        commentsCount: (post.commentsCount || 0) + 1
      });`;
  code = code.replace(oldUpdate, '');
}

// Render Chulbul bot UI in Comments
const renderTarget = `return (
    <div className="flex gap-3 mt-4 group relative">`;
    
const renderReplace = `
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
         </div>
       </div>
     </div>
    );
  }

  return (
    <div className="flex gap-3 mt-4 group relative">`;

if (code.includes(renderTarget)) {
  code = code.replace(renderTarget, renderReplace);
}

fs.writeFileSync(file, code);
console.log("Patched CommentsModal");
