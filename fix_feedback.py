import re

with open('src/components/FeedbackModal.tsx', 'r') as f:
    content = f.read()

target1 = """import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';"""
replacement1 = """import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      fb.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setMyFeedbacks(fb);
    });
    
    return () => unsubscribe();"""
replacement2 = """    const fetchFeedbacks = async () => {
      const q = query(
        collection(db, 'feedback'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const fb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      fb.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setMyFeedbacks(fb);
    };

    fetchFeedbacks();"""
if target2 in content:
    content = content.replace(target2, replacement2)

with open('src/components/FeedbackModal.tsx', 'w') as f:
    f.write(content)
