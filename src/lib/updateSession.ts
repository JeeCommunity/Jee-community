import { doc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

export const updateSessionWithEconomy = async (ref: any, updates: any, addedCoins: number, addedXP: number, uid: string) => {
  await updateDoc(ref, updates);
  if (addedCoins > 0 || addedXP > 0) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      campus: {
        totalCoins: increment(addedCoins),
        totalXP: increment(addedXP)
      }
    }, { merge: true });
  }
};
