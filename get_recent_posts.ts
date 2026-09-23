import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5));
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.docs.length} posts`);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().text, doc.data().createdAt);
  });
}
run().then(() => process.exit(0)).catch(console.error);
