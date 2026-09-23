import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function fixGoals() {
  const sessionsSnap = await db.collection("study_sessions").get();
  let count = 0;
  const todayStr = new Date().toDateString();

  for (const doc of sessionsSnap.docs) {
    const data = doc.data();
    let updated = false;
    let newGoals = [];

    if (data.goals && Array.isArray(data.goals)) {
      newGoals = data.goals.filter((g: any) => {
        // Keep goals that are either missing createdAt (assuming they are from today before the update)
        // OR goals that have createdAt and it matches today's date
        return !g.createdAt || new Date(g.createdAt).toDateString() === todayStr;
      }).map((g: any) => {
        if (!g.createdAt) {
          updated = true;
          return { ...g, createdAt: Date.now() };
        }
        return g;
      });

      if (newGoals.length !== data.goals.length || updated) {
        await doc.ref.update({ goals: newGoals });
        count++;
        console.log(`Fixed goals for user ${doc.id}`);
      }
    }
  }

  console.log(`Finished fixing goals. Updated ${count} users.`);
}

fixGoals().catch(console.error);
