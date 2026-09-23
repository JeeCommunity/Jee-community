const fs = require('fs');

function addChulbulToPosts(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Import moderation tools
  if (!code.includes('getToxicWords')) {
    code = code.replace(`import { useAuth } from '../AuthContext';`, `import { useAuth } from '../AuthContext';\nimport { getToxicWords } from '../lib/moderation';`);
  }

  // Find handleSubmit in CreatePostModal
  if (file.includes('CreatePostModal')) {
    const target = `const newPost: any = {`;
    const replacement = `
      const toxicWordsFound = getToxicWords(content);
      const isToxic = toxicWordsFound.length > 0;
      
      const newPost: any = {
        isToxic: isToxic,
        toxicWords: toxicWordsFound,`;
    
    if (code.includes(target) && !code.includes('toxicWordsFound = getToxicWords')) {
      code = code.replace(target, replacement);
    }

    const afterAddDoc = `await addDoc(collection(db, 'posts'), newPost);`;
    const chulbulAction = `await addDoc(collection(db, 'posts'), newPost);
      
      if (isToxic) {
        const warningComment = {
          text: "Hello! Mera name Inspector Chulbul hai 👮‍♂️ aur mera kaam community ko manage karna. Is post me harassment/spam ho raha hai. Ise stop karein varna account BAN ho jayega! 🚨",
          authorId: 'inspector-chulbul-bot',
          postId: docRef.id,
          createdAt: serverTimestamp(),
          parentId: null,
          likesCount: 0,
          likedBy: [],
        };
        // wait for post to be created then add comment
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('authorId', '==', user.uid), where('content', '==', content));
        getDocs(q).then(async (snap) => {
           if(!snap.empty) {
               warningComment.postId = snap.docs[0].id;
               await addDoc(collection(db, 'comments'), warningComment);
               await updateDoc(doc(db, 'posts', snap.docs[0].id), {
                 commentsCount: (newPost.commentsCount || 0) + 1
               });
           }
        });
      }`;

    if (code.includes(afterAddDoc) && !code.includes('inspector-chulbul-bot')) {
      code = code.replace(afterAddDoc, chulbulAction);
    }
  }

  fs.writeFileSync(file, code);
  console.log("Patched " + file);
}

addChulbulToPosts('src/components/CreatePostModal.tsx');
