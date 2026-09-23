import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const sessionsRef = db.collection('study_sessions');
  const snapshot = await sessionsRef.get();
  
  let deletedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.fullName && data.fullName.toLowerCase().includes('jee')) {
      console.log('Found session for JEE:', doc.id, data.fullName);
      await doc.ref.delete();
      deletedCount++;
      console.log('Deleted session for', doc.id);
    }
  }

  console.log(`Deleted ${deletedCount} ghost sessions.`);
}

run().catch(console.error);
