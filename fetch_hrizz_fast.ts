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

async function run() {
  const userId = "sYoZnmiq0AavIUoocIwSuJcbuRD2";
  
  // User doc
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  // Posts by user
  const postsSnap = await db.collection('posts').where('authorId', '==', userId).get();
  const posts: any[] = [];
  postsSnap.forEach(d => posts.push({ id: d.id, ...d.data() }));

  // Goals under user doc if subcollection exists
  const goalsSnap = await db.collection('users').doc(userId).collection('goals').get().catch(() => null);
  const goals: any[] = [];
  if (goalsSnap) {
    goalsSnap.forEach(d => goals.push({ id: d.id, ...d.data() }));
  }

  // History under user doc
  const historySnap = await db.collection('users').doc(userId).collection('history').get().catch(() => null);
  const history: any[] = [];
  if (historySnap) {
    historySnap.forEach(d => history.push({ id: d.id, ...d.data() }));
  }

  // Study sessions
  const sessionsSnap = await db.collection('study_sessions').where('userId', '==', userId).get().catch(() => null);
  const sessions: any[] = [];
  if (sessionsSnap) {
    sessionsSnap.forEach(d => sessions.push({ id: d.id, ...d.data() }));
  }

  // Look for any groups user belongs to
  const groupsSnap = await db.collection('groups').get();
  const userGroups: any[] = [];
  groupsSnap.forEach(g => {
    const gd = g.data();
    if (gd.members && Array.isArray(gd.members) && gd.members.includes(userId)) {
      userGroups.push({ id: g.id, name: gd.name, role: gd.creatorId === userId ? 'admin' : 'member' });
    }
  });

  const fullData = {
    userId,
    profile: userData,
    posts,
    goals,
    history,
    sessions,
    groups: userGroups
  };

  fs.writeFileSync('hrizz_data.json', JSON.stringify(fullData, null, 2));
  console.log("ALL DATA WRITTEN SUCCESSFULLY");
}

run().catch(console.error);
