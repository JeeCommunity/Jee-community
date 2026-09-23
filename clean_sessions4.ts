import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const sessionsRef = db.collection('study_sessions');
  const sessionsSnap = await sessionsRef.get();
  
  let deletedCount = 0;
  for (const sessionDoc of sessionsSnap.docs) {
    const data = sessionDoc.data();
    if (data.fullName === 'JEE' || data.username === 'JEE') {
      console.log(`Deleting session for ${data.fullName} (ID: ${sessionDoc.id}).`);
      await sessionDoc.ref.delete();
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} sessions named exactly JEE.`);
}

run().catch(console.error);
