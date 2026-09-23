import fs from 'fs';

const content = `import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

// Embedded default configuration from firebase-applet-config.json
// Ensures deployment to Netlify/Vercel/etc. works out-of-the-box without missing env errors
const fallbackConfig = {
  projectId: "gen-lang-client-0549145255",
  appId: "1:790109911301:web:5aa93b7d71ed1c8b565f6c",
  apiKey: "AIzaSyAstKxpk9xlKuWh9LlR5HlbRkYCcWYufs4",
  authDomain: "gen-lang-client-0549145255.firebaseapp.com",
  storageBucket: "gen-lang-client-0549145255.firebasestorage.app",
  messagingSenderId: "790109911301",
  measurementId: "",
  oAuthClientId: "790109911301-svrhr117cmkop87r2foebs2v460emqna.apps.googleusercontent.com"
};

export const isFirebaseConfigured = () => {
  return !!(
    (import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey) &&
    (import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId)
  );
};

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket || (fallbackConfig.projectId ? \`\${fallbackConfig.projectId}.appspot.com\` : undefined),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId || undefined
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
  
  // Messaging only works in a browser environment that supports it
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
console.log("src/firebase.ts updated successfully");
