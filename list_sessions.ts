import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const sessionsRef = db.collection('study_sessions');
  const sessionsSnap = await sessionsRef.get();
  
  for (const sessionDoc of sessionsSnap.docs) {
    const data = sessionDoc.data();
    console.log(`ID: ${sessionDoc.id} | Name: "${data.fullName}" | Username: "${data.username}" | Studying: ${data.isStudying}`);
  }
}

run().catch(console.error);
