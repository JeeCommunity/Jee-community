import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saEnv) {
  console.log("No FIREBASE_SERVICE_ACCOUNT in process.env");
  process.exit(1);
}

const serviceAccount = JSON.parse(saEnv);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function run() {
  console.log("=== SEARCHING USERS ===");
  const usersSnap = await db.collection('users').get();
  console.log(`Total users in DB: ${usersSnap.size}`);
  
  const matchedUsers: any[] = [];
  usersSnap.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('hriz') || str.includes('🐬')) {
      matchedUsers.push({ id: doc.id, ...data });
    }
  });

  console.log(`Matched users count: ${matchedUsers.length}`);
  for (const u of matchedUsers) {
    console.log("--- USER ---");
    console.log(JSON.stringify(u, null, 2));
  }

  const userIds = matchedUsers.map(u => u.id);

  console.log("\n=== SEARCHING POSTS ===");
  const postsSnap = await db.collection('posts').get();
  console.log(`Total posts in DB: ${postsSnap.size}`);
  const matchedPosts: any[] = [];
  postsSnap.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (userIds.includes(data.authorId) || str.includes('hriz') || str.includes('🐬')) {
      matchedPosts.push({ id: doc.id, ...data });
    }
  });

  console.log(`Matched posts count: ${matchedPosts.length}`);
  for (const p of matchedPosts) {
    console.log("--- POST ---");
    console.log(JSON.stringify(p, null, 2));
  }

  console.log("\n=== SEARCHING COMMENTS ===");
  try {
    const commentsSnap = await db.collectionGroup('comments').get();
    console.log(`Total comments: ${commentsSnap.size}`);
    const matchedComments: any[] = [];
    commentsSnap.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (userIds.includes(data.userId) || userIds.includes(data.authorId) || str.includes('hriz') || str.includes('🐬')) {
        matchedComments.push({ id: doc.id, parent: doc.ref.parent.parent?.id, ...data });
      }
    });
    console.log(`Matched comments: ${matchedComments.length}`);
    for (const c of matchedComments) {
      console.log("--- COMMENT ---");
      console.log(JSON.stringify(c, null, 2));
    }
  } catch (err: any) {
    console.log("Error searching comments:", err.message);
  }

  console.log("\n=== SEARCHING GROUP CHATS / MESSAGES ===");
  try {
    const msgsSnap = await db.collectionGroup('messages').get();
    console.log(`Total messages in DB: ${msgsSnap.size}`);
    const matchedMsgs: any[] = [];
    msgsSnap.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (userIds.includes(data.senderId) || userIds.includes(data.userId) || str.includes('hriz') || str.includes('🐬')) {
        matchedMsgs.push({ id: doc.id, ...data });
      }
    });
    console.log(`Matched messages count: ${matchedMsgs.length}`);
    for (const m of matchedMsgs) {
      console.log("--- MSG ---");
      console.log(JSON.stringify(m, null, 2));
    }
  } catch (err: any) {
    console.log("Error searching messages:", err.message);
  }

  console.log("\n=== SEARCHING STUDY SESSIONS / ROOMS / GOALS ===");
  try {
    const goalsSnap = await db.collectionGroup('goals').get().catch(() => null);
    if (goalsSnap) {
      goalsSnap.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (userIds.includes(doc.ref.parent.parent?.id) || str.includes('hriz') || str.includes('🐬')) {
          console.log("GOAL:", doc.ref.parent.parent?.id, JSON.stringify(data));
        }
      });
    }
  } catch (e: any) {
    console.log("Goals error:", e.message);
  }
}

run().catch(console.error);
