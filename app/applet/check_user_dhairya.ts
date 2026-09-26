import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUser() {
  const targetEmail = 'dhairyavyas2003@gmail.com';
  console.log(`Searching for email: ${targetEmail}`);
  
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  let found = false;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.email && data.email.toLowerCase() === targetEmail.toLowerCase()) {
      console.log(`FOUND USER! Doc ID: ${doc.id}`, data);
      found = true;
    }
  });
  
  if (!found) {
    console.log("RESULT: User does NOT exist in Firestore users collection.");
  }
  process.exit(0);
}

checkUser().catch(err => {
  console.error("Error querying user:", err);
  process.exit(1);
});
