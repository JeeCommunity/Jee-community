import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

export const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (import.meta.env.VITE_FIREBASE_PROJECT_ID ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com` : undefined),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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

// Helper to get db or throw if not configured (to avoid undefined errors in components that assume it exists)
// But for now we just export them as they are and handle undefined in AuthContext
export { app, auth, db, storage, messaging };
