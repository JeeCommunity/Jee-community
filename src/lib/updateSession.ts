import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { saveSupabaseStudySession } from './supabaseHub';

export const updateSessionWithEconomy = async (
  _ref: any,
  updates: any,
  addedCoins: number,
  addedXP: number,
  uid: string
) => {
  await saveSupabaseStudySession(uid, updates);
  if (addedCoins > 0 || addedXP > 0) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          campus: {
            totalCoins: increment(addedCoins),
            totalXP: increment(addedXP),
          },
        },
        { merge: true }
      );
    } catch {
      // ignore if Firebase quota reached
    }
  }
};
