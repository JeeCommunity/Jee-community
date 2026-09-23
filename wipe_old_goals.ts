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

async function wipeOldGoals() {
  const sessionsSnap = await db.collection("study_sessions").get();
  let count = 0;
  const todayStr = new Date().toDateString();

  for (const doc of sessionsSnap.docs) {
    const data = doc.data();
    if (data.goals && Array.isArray(data.goals)) {
      const originalLength = data.goals.length;
      
      // We only keep goals created today
      const newGoals = data.goals.filter((g: any) => {
        return g.createdAt && new Date(g.createdAt).toDateString() === todayStr;
      });

      if (newGoals.length !== originalLength) {
        let updateData: any = { goals: newGoals };
        
        // If they had an active goal that we just deleted, we need to clear activeGoalId too!
        if (data.activeGoalId && !newGoals.find(g => g.id === data.activeGoalId)) {
          updateData.activeGoalId = null;
          updateData.isStudying = false; // Stop their session if their goal was deleted
        }

        await doc.ref.update(updateData);
        count++;
        console.log(`Wiped old goals for user ${doc.id}`);
      }
    }
  }

  console.log(`Finished wiping old goals. Updated ${count} users.`);
}

wipeOldGoals().catch(console.error);
