import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saEnv) {
  fs.writeFileSync('search_output.json', JSON.stringify({ error: "no env" }));
  process.exit(1);
}
const serviceAccount = JSON.parse(saEnv);
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  const matchedUsers: any[] = [];
  usersSnap.forEach(doc => {
    const d = doc.data();
    const str = JSON.stringify(d).toLowerCase();
    if (str.includes('hriz') || str.includes('🐬') || str.includes('hrizz')) {
      matchedUsers.push({ id: doc.id, ...d });
    }
  });

  const postsSnap = await db.collection('posts').get();
  const matchedPosts: any[] = [];
  postsSnap.forEach(doc => {
    const d = doc.data();
    const str = JSON.stringify(d).toLowerCase();
    if (str.includes('hriz') || str.includes('🐬') || matchedUsers.some(u => u.id === d.authorId)) {
      matchedPosts.push({ id: doc.id, ...d });
    }
  });

  fs.writeFileSync('search_output.json', JSON.stringify({ matchedUsers, matchedPosts }, null, 2));
  console.log("DONE! Users:", matchedUsers.length, "Posts:", matchedPosts.length);
}

run().catch(err => {
  fs.writeFileSync('search_output.json', JSON.stringify({ error: err.message }));
});
