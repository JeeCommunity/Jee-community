import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import dotenv from "dotenv";
dotenv.config();

// Parse service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function cleanOldGoals() {
  const sessionsSnap = await db.collection("study_sessions").get();
  const todayStr = new Date().toDateString();
  let count = 0;

  for (const doc of sessionsSnap.docs) {
    const data = doc.data();
    if (data.goals && Array.isArray(data.goals)) {
      const originalLength = data.goals.length;
      const filteredGoals = data.goals.filter((g: any) => {
        return g.createdAt && new Date(g.createdAt).toDateString() === todayStr;
      });

      if (filteredGoals.length < originalLength) {
        // We found old goals! Update the document.
        await doc.ref.update({
          goals: filteredGoals
        });
        count++;
        console.log(`Cleaned old goals for user ${doc.id}`);
      }
    }
  }

  console.log(`Finished cleaning old goals. Updated ${count} users.`);
}

cleanOldGoals().catch(console.error);
