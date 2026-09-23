const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
require('dotenv').config();

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function run() {
  console.log("Searching for user @harsh9ay...");
  
  // Try to find the user by username or email or name
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  
  let targetUser = null;
  snap.forEach(doc => {
    const data = doc.data();
    if (
      (data.username && data.username.toLowerCase().includes('harsh9ay')) ||
      (data.email && data.email.toLowerCase().includes('harsh9ay')) ||
      (data.displayName && data.displayName.toLowerCase().includes('harsh9ay'))
    ) {
      targetUser = { id: doc.id, ...data };
    }
  });

  if (!targetUser) {
    console.log("User @harsh9ay not found in the users collection.");
    
    // Check posts directly just in case
    const postsRef = collection(db, 'posts');
    const postsSnap = await getDocs(postsRef);
    const harshPosts = [];
    postsSnap.forEach(d => {
       const p = d.data();
       if (p.authorName && p.authorName.toLowerCase().includes('harsh9ay')) {
           harshPosts.push(p);
       }
    });
    console.log(`Found ${harshPosts.length} posts by harsh9ay (by authorName)`);
    if(harshPosts.length > 0) {
       console.log(harshPosts.map(p => ({ text: p.text, time: p.createdAt })));
    }
    
    return;
  }
  
  console.log("User Found:", targetUser.id, targetUser.displayName, targetUser.email, targetUser.username);
  
  // Get their posts
  console.log("\n--- POSTS ---");
  const postsQ = query(collection(db, 'posts'), where('authorId', '==', targetUser.id));
  const postsSnap = await getDocs(postsQ);
  postsSnap.forEach(d => {
    console.log(`Post [${d.id}]: ${d.data().text?.substring(0, 100)} (Likes: ${d.data().likes || 0})`);
  });

  // Get their comments
  console.log("\n--- COMMENTS ---");
  const commentsQ = query(collection(db, 'comments'), where('authorId', '==', targetUser.id));
  const commentsSnap = await getDocs(commentsQ);
  commentsSnap.forEach(d => {
    console.log(`Comment [${d.id}]: ${d.data().text?.substring(0, 100)}`);
  });
  
  // Get study sessions
  console.log("\n--- STUDY SESSIONS ---");
  const studySnap = await getDocs(query(collection(db, 'study_sessions'), where('userId', '==', targetUser.id)));
  studySnap.forEach(d => {
    console.log(`Study Session [${d.id}]: ${d.data().totalMinutes || 0} minutes total`);
  });
}
run().then(() => process.exit(0)).catch(console.error);
