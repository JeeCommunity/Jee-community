import { getToken } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { messaging, db } from '../firebase';

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging || !db) {
    console.warn("Firebase messaging or db is not initialized.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // NOTE: Get the VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.warn("VITE_FIREBASE_VAPID_KEY is not set in environment variables. FCM Token generation may fail.");
      }

      
      let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }
      registration.update();
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

      
      if (token) {
        console.log('FCM Token generated:', token);
        // Save token to user document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmToken: token,
          notificationsEnabled: true
        });
        return token;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('An error occurred while requesting notification permission:', error?.message || 'Error');
  }
};
