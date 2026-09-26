import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: 'community-6fe4e'
});

const auth = getAuth();
const db = getFirestore();

async function checkUser() {
  try {
    const userRecord = await auth.getUserByEmail('dhairyavyas2003@gmail.com');
    console.log("=== Firebase Auth Details ===");
    console.log("UID:", userRecord.uid);
    console.log("Email:", userRecord.email);
    console.log("Display Name:", userRecord.displayName);
    console.log("Phone Number:", userRecord.phoneNumber);
    console.log("Photo URL:", userRecord.photoURL);
    console.log("Email Verified:", userRecord.emailVerified);
    console.log("Creation Time:", userRecord.metadata.creationTime);
    console.log("Last Sign-In Time:", userRecord.metadata.lastSignInTime);

    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      console.log("\n=== Firestore User Document ===");
      console.log(userDoc.data());
    } else {
      console.log("\n=== Firestore User Document ===");
      console.log("No document found in 'users' collection with UID:", userRecord.uid);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkUser();
