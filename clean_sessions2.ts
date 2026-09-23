import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const sessionsRef = db.collection('study_sessions');
  const snapshot = await sessionsRef.get();
  
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.username && data.username.toLowerCase().includes('jee')) {
      console.log('Found session by username:', doc.id, data.username);
      await doc.ref.delete();
      count++;
    }
  }

  console.log(`Deleted ${count} ghost sessions.`);
}

run().catch(console.error);
