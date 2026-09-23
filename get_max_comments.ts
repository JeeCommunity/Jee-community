import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'comments'));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.text && (data.text.includes('khudh ka ai') || data.text.includes('genrate karwaya') || data.text.includes('google ai.studio'))) {
      console.log('Found comment:', data.text);
    }
  });

  const q2 = query(collection(db, 'notifications'));
  const snap2 = await getDocs(q2);
  snap2.forEach(doc => {
    const data = doc.data();
    if (data.senderName?.includes('Max') || data.commentContent?.includes('genrate')) {
       console.log('Found notification:', data);
    }
  });
}
run().then(() => process.exit(0)).catch(console.error);
