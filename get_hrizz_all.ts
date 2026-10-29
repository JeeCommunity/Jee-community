import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(saEnv!);
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function getFullDetails() {
  const usersSnap = await db.collection('users').get();
  let targetUser: any = null;
  usersSnap.forEach(doc => {
    const d = doc.data();
    const str = JSON.stringify(d).toLowerCase();
    if (str.includes('hriz') || str.includes('🐬')) {
      targetUser = { id: doc.id, ...d };
    }
  });

  if (!targetUser) {
    console.log("User not found");
    return;
  }

  console.log("Target user found:", targetUser.id, targetUser.fullName, targetUser.email);

  // Get posts by targetUser
  const postsSnap = await db.collection('posts').get();
  const userPosts: any[] = [];
  postsSnap.forEach(doc => {
    const d = doc.data();
    if (d.authorId === targetUser.id || JSON.stringify(d).toLowerCase().includes('hriz') || JSON.stringify(d).includes('🐬')) {
      userPosts.push({ id: doc.id, ...d });
    }
  });

  // Get comments from posts
  const userComments: any[] = [];
  for (const post of postsSnap.docs) {
    try {
      const cSnap = await post.ref.collection('comments').get();
      cSnap.forEach(cdoc => {
        const cd = cdoc.data();
        if (cd.authorId === targetUser.id || cd.userId === targetUser.id || JSON.stringify(cd).toLowerCase().includes('hriz') || JSON.stringify(cd).includes('🐬')) {
          userComments.push({
            id: cdoc.id,
            postId: post.id,
            postText: post.data().text?.slice(0, 50),
            ...cd
          });
        }
      });
    } catch (e) {}
  }

  // Get messages from groups
  const userMsgs: any[] = [];
  try {
    const groupsSnap = await db.collection('groups').get();
    for (const g of groupsSnap.docs) {
      const mSnap = await g.ref.collection('messages').get();
      mSnap.forEach(mdoc => {
        const md = mdoc.data();
        if (md.senderId === targetUser.id || md.userId === targetUser.id || JSON.stringify(md).toLowerCase().includes('hriz') || JSON.stringify(md).includes('🐬')) {
          userMsgs.push({
            id: mdoc.id,
            groupId: g.id,
            groupName: g.data().name,
            ...md
          });
        }
      });
    }
  } catch (e) {}

  // Check study_sessions
  const studySessions: any[] = [];
  try {
    const sessSnap = await db.collection('study_sessions').get();
    sessSnap.forEach(doc => {
      const d = doc.data();
      if (d.userId === targetUser.id || d.authorId === targetUser.id || JSON.stringify(d).includes(targetUser.id)) {
        studySessions.push({ id: doc.id, ...d });
      }
    });
  } catch (e) {}

  const result = {
    user: targetUser,
    postsCount: userPosts.length,
    posts: userPosts,
    commentsCount: userComments.length,
    comments: userComments,
    messagesCount: userMsgs.length,
    messages: userMsgs,
    studySessionsCount: studySessions.length,
    studySessions: studySessions
  };

  fs.writeFileSync('hrizz_full_details.json', JSON.stringify(result, null, 2));
  console.log("Finished! Output saved to hrizz_full_details.json");
}

getFullDetails().catch(console.error);
