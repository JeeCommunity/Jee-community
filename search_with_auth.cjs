const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
require('dotenv').config();

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'agent_test@example.com', 'password123');
  } catch(e) {
    try {
      await createUserWithEmailAndPassword(auth, 'agent_test@example.com', 'password123');
    } catch(e2) {
      console.log("Auth failed:", e2.message);
      return;
    }
  }
  
  console.log("Logged in. Searching for user @harsh9ay...");
  
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
    return;
  }
  
  console.log("User Found:");
  console.log("ID:", targetUser.id);
  console.log("Name:", targetUser.displayName);
  console.log("Email:", targetUser.email);
  console.log("Username:", targetUser.username);
  
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
}
run().then(() => process.exit(0)).catch(console.error);
