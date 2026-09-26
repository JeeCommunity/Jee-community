import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

initializeApp();
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
    console.log("Disabled:", userRecord.disabled);
    console.log("Creation Time:", userRecord.metadata.creationTime);
    console.log("Last Sign-In Time:", userRecord.metadata.lastSignInTime);
    console.log("Provider Data:", userRecord.providerData);

    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      console.log("\n=== Firestore User Document ===");
      console.log(userDoc.data());
    } else {
      console.log("\n=== Firestore User Document ===");
      console.log("No document found in 'users' collection with UID:", userRecord.uid);
    }

    const querySnap = await db.collection('users').where('email', '==', 'dhairyavyas2003@gmail.com').get();
    if (!querySnap.empty) {
      console.log("\n=== Found by email in Firestore ===");
      querySnap.forEach(d => console.log(d.id, d.data()));
    }

  } catch (err) {
    console.error("Error fetching user details:", err);
  }
}

checkUser();
