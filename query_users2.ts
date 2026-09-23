import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`User: ${data.fullName} | Email: ${data.email}`);
  });
}

run().catch(console.error);
