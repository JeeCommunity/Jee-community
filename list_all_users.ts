import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.fullName && data.fullName.toLowerCase().includes('jee')) {
      console.log(`User: ${data.fullName} | Email: ${data.email} | ID: ${doc.id}`);
    }
  }
}

run().catch(console.error);
