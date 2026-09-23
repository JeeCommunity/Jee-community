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
    const goalsString = JSON.stringify(data.goals || []);
    if (goalsString.toLowerCase().includes('night') || goalsString.toLowerCase().includes('master')) {
      console.log(`Found matching goals for ID: ${sessionDoc.id} | Name: "${data.fullName}" | Goals: ${goalsString}`);
    }
  }
}

run().catch(console.error);
