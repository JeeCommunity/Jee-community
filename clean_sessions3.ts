import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function run() {
  const sessionsRef = db.collection('study_sessions');
  const usersRef = db.collection('users');
  
  const sessionsSnap = await sessionsRef.get();
  
  let deletedCount = 0;
  for (const sessionDoc of sessionsSnap.docs) {
    const userId = sessionDoc.id; // Assuming session doc ID is the user ID
    const userSnap = await usersRef.doc(userId).get();
    
    if (!userSnap.exists) {
      console.log(`Ghost session found for ${sessionDoc.data().fullName} (ID: ${userId}). Deleting...`);
      await sessionDoc.ref.delete();
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} ghost sessions in total.`);
}

run().catch(console.error);
