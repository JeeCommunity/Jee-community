import fs from 'fs';

const content = `import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

// Real production Firebase configuration for Community (239+ users)
const realFirebaseConfig = {
  apiKey: "AIzaSyCuELMNcijNlUjuegK3qoIKiwnEyoFMGHQ",
  authDomain: "community-6fe4e.firebaseapp.com",
  projectId: "community-6fe4e",
  storageBucket: "community-6fe4e.firebasestorage.app",
  messagingSenderId: "1018138805762",
  appId: "1:1018138805762:web:33971daf806aef642d091b",
  measurementId: "G-88CHZP0V5H"
};

export const isFirebaseConfigured = () => {
  return !!(
    (import.meta.env.VITE_FIREBASE_API_KEY || realFirebaseConfig.apiKey) &&
    (import.meta.env.VITE_FIREBASE_PROJECT_ID || realFirebaseConfig.projectId)
  );
};

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || realFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || realFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || realFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || realFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || realFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || realFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || realFirebaseConfig.measurementId
});

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let messaging: Messaging | undefined;

if (isFirebaseConfigured()) {
  const config = getFirebaseConfig();
  console.log("Firebase initializing with Project ID:", config.projectId);
  app = initializeApp(config);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence);
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
  storage = getStorage(app);
  
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      console.warn("Firebase Messaging could not be initialized", (e as any)?.message || 'Error');
    }
  }
}

export { app, auth, db, storage, messaging };
`;

fs.writeFileSync('src/firebase.ts', content, 'utf8');
console.log("Updated src/firebase.ts with REAL community-6fe4e config!");
