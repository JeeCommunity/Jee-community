import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

let serviceAccount = JSON.parse(fs.readFileSync('./payload.json', 'utf-8')).firebase_admin_key;
if (typeof serviceAccount === 'string') {
  serviceAccount = JSON.parse(serviceAccount);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const allUsers = await db.collection('users').get();
  allUsers.forEach(doc => console.log(doc.id, doc.data().email, doc.data().fullName, doc.data().isBlocked));
}
run().then(() => process.exit(0)).catch(console.error);
