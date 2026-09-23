const fs = require('fs');

let file = 'src/components/CreatePostModal.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('getToxicWords')) {
  code = code.replace(`import { useAuth } from '../AuthContext';`, `import { useAuth } from '../AuthContext';\nimport { getToxicWords } from '../lib/moderation';`);
}

const targetPostData = `const postData: any = {`;
const replacePostData = `
      const toxicWordsFound = getToxicWords(String(text).trim());
      const isToxic = toxicWordsFound.length > 0;

      const postData: any = {
        isToxic: isToxic,
        toxicWords: toxicWordsFound,`;

if (code.includes(targetPostData) && !code.includes('const isToxic = toxicWordsFound.length > 0;')) {
  code = code.replace(targetPostData, replacePostData);
}

const targetAddDoc = `const docRef = await addDoc(collection(db, 'posts'), postData);`;
const replaceAddDoc = `const docRef = await addDoc(collection(db, 'posts'), postData);
      
      if (isToxic) {
        const warningComment = {
          text: "Arey oye! 🛑 Inspector Chulbul here! Mera kaam hai is community ko saaf-suthra rakhna. Tumhare is message me mujhe kuch gadbad aur toxic words mile hain. Aisi bhasha ka istemaal turant rok do warna seedha lockup (Account BAN)! Samajh gaye na? 🚨👮‍♂️",
          authorId: 'inspector-chulbul-bot',
          postId: docRef.id,
          createdAt: new Date(),
          parentId: null,
          likesCount: 0,
          likedBy: [],
        };
        await addDoc(collection(db, 'comments'), warningComment);
        await updateDoc(doc(db, 'posts', docRef.id), {
          commentsCount: 1
        });
      }`;

if (code.includes(targetAddDoc) && !code.includes('inspector-chulbul-bot')) {
  code = code.replace(targetAddDoc, replaceAddDoc);
}

fs.writeFileSync(file, code);
console.log("Patched CreatePostModal");
