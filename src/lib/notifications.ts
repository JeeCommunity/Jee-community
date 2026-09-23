
import { collection, addDoc, getDocs, getDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { safeStringify } from './safeStringify';
import { db } from '../firebase';

export interface NotificationData {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: string;
  postId?: string;
  postContent?: string;
  commentId?: string;
  commentContent?: string;
  noteId?: string;
  noteTitle?: string;
}

const triggerFCM = async (tokens: string[], title: string, body: string, data: any) => {
  if (!tokens || tokens.length === 0) return;
  try {
    await fetch('/api/dispatch-fcm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify({
        tokens,
        title,
        body,
        data,
        icon: '/vite.svg'
      })
    });
  } catch (error: any) {
    console.error("FCM trigger failed", error?.message || 'Error');
  }
};

export const createNotification = async (data: NotificationData) => {
  try {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await addDoc(collection(db, 'notifications'), {
      ...cleanData,
      read: false,
      createdAt: serverTimestamp()
    });

    // Fetch recipient fcm token
    const userDoc = await getDoc(doc(db, 'users', data.recipientId));
    if ((data.type === 'cheer_fire' || data.type === 'cheer_clap') && userDoc.data()?.cheersEnabled === false) {
       return; // User opted out of cheers
    }
    if (userDoc.exists() && userDoc.data().fcmToken && userDoc.data().notificationsEnabled) {
       let title = "New Notification";
       let body = "";
       if (data.type === 'like') {
          title = "New Like";
          body = `${data.senderName} liked your post.`;
       } else if (data.type === 'comment') {
          title = "New Comment";
          body = `${data.senderName} commented on your post.`;
       } else if (data.type === 'mention') {
          title = "You were mentioned";
          body = `${data.senderName} mentioned you.`;
       } else if (data.type === 'reply') {
          title = "New Reply";
          body = `${data.senderName} replied to your comment.`;
       } else if (data.type === 'cheer_fire') {
          title = "Keep the fire burning! 🔥";
          body = `${data.senderName} cheered for your focus!`;
       } else if (data.type === 'cheer_clap') {
          title = "Claps for your hard work! 👏";
          body = `${data.senderName} cheered for your focus!`;
       }

       await triggerFCM([userDoc.data().fcmToken], title, body, cleanData);
    }

  } catch (error: any) {
    console.error("Error sending notification:", error?.message || 'Error');
  }
};

export const sendGlobalNotification = async (senderId: string, senderName: string, senderAvatar: string, type: string, extraData: any = {}, communityType?: string) => {
  try {
    const cleanExtraData = Object.fromEntries(
      Object.entries(extraData).filter(([_, v]) => v !== undefined)
    );
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);
    let count = 0;
    
    const fcmTokens: string[] = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (communityType && communityType !== 'JEE' && communityType !== 'Both') return;
      if (userDoc.id !== senderId) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          recipientId: userDoc.id,
          senderId,
          senderName,
          senderAvatar,
          type,
          ...cleanExtraData,
          read: false,
          createdAt: serverTimestamp()
        });
        count++;

        if (userData.fcmToken && userData.notificationsEnabled) {
           fcmTokens.push(userData.fcmToken);
        }
      }
    });

    if (count > 0) {
      await batch.commit();
      
      let title = "New Announcement";
      let body = `${senderName} posted a new update.`;
      
      if (type === 'live_study') {
         title = "Live Study Session";
         body = `${senderName} just started a live study session!`;
      } else if (type === 'notes') {
         title = "New Notes";
         body = `${senderName} uploaded new study notes.`;
      }
      
      await triggerFCM(fcmTokens, title, body, { type, ...cleanExtraData });
    }
  } catch (error: any) {
    console.error("Error sending global notification:", error?.message || 'Error');
  }
};
