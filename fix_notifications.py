import re

with open('src/components/NotificationsDropdown.tsx', 'r') as f:
    content = f.read()

target1 = """import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit, deleteDoc } from 'firebase/firestore';"""
replacement1 = """import { collection, query, where, orderBy, getDocs, updateDoc, doc, limit, deleteDoc } from 'firebase/firestore';"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      let unread = 0;
      
      // Handle native browser notifications for fresh data
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Check if notification is less than 10 seconds old
          const isRecent = data.createdAt?.toMillis && (Date.now() - data.createdAt.toMillis() < 10000);
          if (isRecent && !data.isRead && (data.type === 'cheer_fire' || data.type === 'cheer_clap')) {
             playNotificationSound();
             // Let FCM handle the actual browser notification if in background,
             // but we could also show a toast here if we want.
          }
        }
      });

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        notifs.push({ id: doc.id, ...data });
        if (!data.isRead) {
          unread++;
        }
      });
      setNotifications(notifs);
      setUnreadCount(unread);
    });

    return () => unsubscribe();"""
replacement2 = """    const fetchNotifications = async () => {
      if (!user) return;
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const notifs: any[] = [];
      let unread = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        notifs.push({ id: doc.id, ...data });
        if (!data.isRead) {
          unread++;
        }
      });
      setNotifications(notifs);
      setUnreadCount(unread);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);"""
if target2 in content:
    content = content.replace(target2, replacement2)

with open('src/components/NotificationsDropdown.tsx', 'w') as f:
    f.write(content)
