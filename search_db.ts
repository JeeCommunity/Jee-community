import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const postsSnap = await db.collection('posts').get();
  for (const doc of postsSnap.docs) {
    const data = doc.data();
    if (data.authorId === '5IlLtHOZpqXmLPIj7EmBvGOTnH42' || (data.authorName && data.authorName.includes('JEE'))) {
      console.log('Found post from JEE:', doc.id, data.authorName);
    }
  }
}

run().catch(console.error);
