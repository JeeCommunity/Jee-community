const fs = require('fs');

let file = 'src/components/CreatePostModal.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetAutoWarning = `      if (isToxic) {
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

code = code.replace(targetAutoWarning, '');

fs.writeFileSync(file, code);
console.log("Removed auto warning from CreatePostModal");
