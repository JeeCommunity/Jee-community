const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

let serviceAccount;
try {
  const payload = JSON.parse(fs.readFileSync('./payload.json', 'utf-8'));
  serviceAccount = typeof payload.firebase_admin_key === 'string' 
    ? JSON.parse(payload.firebase_admin_key) 
    : payload.firebase_admin_key;
} catch (e) {
  console.error("Error reading payload.json:", e.message);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function searchEverything() {
  console.log("=== SEARCHING USERS ===");
  const usersSnapshot = await db.collection('users').get();
  const matchedUsers = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('hriz') || str.includes('🐬')) {
      matchedUsers.push({ id: doc.id, ...data });
    }
  });

  console.log(`Found ${matchedUsers.length} matched user(s):`);
  matchedUsers.forEach(u => {
    console.log(JSON.stringify(u, null, 2));
  });

  const targetUserIds = matchedUsers.map(u => u.id);

  console.log("\n=== SEARCHING POSTS ===");
  const postsSnapshot = await db.collection('posts').get();
  const matchedPosts = [];
  postsSnapshot.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (targetUserIds.includes(data.authorId) || str.includes('hriz') || str.includes('🐬')) {
      matchedPosts.push({ id: doc.id, ...data });
    }
  });

  console.log(`Found ${matchedPosts.length} matched post(s):`);
  matchedPosts.forEach(p => {
    console.log(`Post ID: ${p.id}, Author: ${p.authorId || p.authorName}, Text: ${p.text || p.content || p.title}, CreatedAt: ${p.createdAt?.toDate ? p.createdAt.toDate() : p.createdAt}`);
    if (p.poll) console.log("Poll:", JSON.stringify(p.poll));
    if (p.imageUrl) console.log("Image:", p.imageUrl);
  });

  console.log("\n=== SEARCHING COMMENTS ===");
  const commentsSnapshot = await db.collectionGroup('comments').get().catch(() => null);
  if (commentsSnapshot) {
    let count = 0;
    commentsSnapshot.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (targetUserIds.includes(data.userId) || targetUserIds.includes(data.authorId) || str.includes('hriz') || str.includes('🐬')) {
        count++;
        console.log(`Comment ID: ${doc.id}, Author: ${data.userName || data.authorName || data.userId}, Text: ${data.text || data.content}`);
      }
    });
    console.log(`Found ${count} comment(s)`);
  }

  console.log("\n=== SEARCHING GROUP CHATS / MESSAGES ===");
  const msgsSnapshot = await db.collectionGroup('messages').get().catch(() => null);
  if (msgsSnapshot) {
    let msgCount = 0;
    msgsSnapshot.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (targetUserIds.includes(data.senderId) || targetUserIds.includes(data.userId) || str.includes('hriz') || str.includes('🐬')) {
        msgCount++;
        console.log(`Msg ID: ${doc.id}, Sender: ${data.senderName || data.userName || data.senderId}, Text: ${data.text || data.message || data.content}`);
      }
    });
    console.log(`Found ${msgCount} message(s)`);
  }
}

searchEverything().then(() => {
  console.log("\nSearch completed.");
  process.exit(0);
}).catch(err => {
  console.error("Search failed:", err);
  process.exit(1);
});
