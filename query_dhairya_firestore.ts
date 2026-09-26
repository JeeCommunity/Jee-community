import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

initializeApp();
const db = getFirestore();

async function searchFirestore() {
  try {
    const collections = ['users', 'profiles', 'community_users', 'members'];
    for (const col of collections) {
      const snap = await db.collection(col).get();
      console.log(`Checking collection: ${col} (${snap.size} docs)`);
      snap.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes('dhairya') || str.includes('dhairyavyas2003@gmail.com')) {
          console.log(`Found in [${col}] doc ID: ${doc.id}`);
          console.log(data);
        }
      });
    }

    const otherCols = ['posts', 'comments', 'messages', 'group_chats'];
    for (const col of otherCols) {
      const snap = await db.collection(col).limit(100).get();
      snap.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes('dhairya') || str.includes('dhairyavyas2003@gmail.com')) {
          console.log(`Found in [${col}] doc ID: ${doc.id}`);
          console.log(data);
        }
      });
    }
  } catch (err) {
    console.error("Error querying firestore:", err);
  }
}

searchFirestore();
