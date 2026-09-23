const fs = require('fs');

const oldTextPost = 'Hello! Mera name Inspector Chulbul hai 👮‍♂️ aur mera kaam community ko manage karna. Is post me harassment/spam ho raha hai. Ise stop karein varna account BAN ho jayega! 🚨';
const oldTextComment = 'Hello! Mera name Inspector Chulbul hai 👮‍♂️ aur mera kaam community ko manage karna. Is comment me harassment/spam ho raha hai. Ise stop karein varna account BAN ho jayega! 🚨';

const newText = 'Arey oye! 🛑 Inspector Chulbul here! Mera kaam hai is community ko saaf-suthra rakhna. Tumhare is message me mujhe kuch gadbad aur toxic words mile hain. Aisi bhasha ka istemaal turant rok do warna seedha lockup (Account BAN)! Samajh gaye na? 🚨👮‍♂️';

function updateMsg(file, oldT) {
   let code = fs.readFileSync(file, 'utf8');
   code = code.split(oldT).join(newText);
   fs.writeFileSync(file, code);
   console.log("Updated message in " + file);
}

updateMsg('src/components/CreatePostModal.tsx', oldTextPost);
updateMsg('src/components/CommentsModal.tsx', oldTextComment);
