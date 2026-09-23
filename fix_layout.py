import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

target1 = """import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';"""
replacement1 = """import { doc, collection, query, where, getDoc, getCountFromServer } from 'firebase/firestore';"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """  useEffect(() => {
    if (!user) return;
    const unsubSession = onSnapshot(doc(db, "study_sessions", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setMySession(docSnap.data());
      } else {
        setMySession(null);
      }
    });

    const unsubStats = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.campus) {
          setCampusStats({
            totalXP: data.campus.totalXP || 0,
            totalCoins: data.campus.totalCoins || 0
          });
        }
      }
    });
    
    return () => {
      unsubSession();
      unsubStats();
    };
  }, [user]);"""
replacement2 = """  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "study_sessions", user.uid));
        if (docSnap.exists()) {
          setMySession(docSnap.data());
        } else {
          setMySession(null);
        }
        
        const statsSnap = await getDoc(doc(db, "users", user.uid));
        if (statsSnap.exists()) {
          const data = statsSnap.data();
          if (data.campus) {
            setCampusStats({
              totalXP: data.campus.totalXP || 0,
              totalCoins: data.campus.totalCoins || 0
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserData();
  }, [user]);"""
if target2 in content:
    content = content.replace(target2, replacement2)

target3 = """  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'study_sessions'), where('isStudying', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let activeCount = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const c = data.communityType;
        if (c && c !== currentCommunity && c !== 'Both') return;
        if (!c && currentCommunity !== 'JEE') return;
        activeCount++;
      });
      setActiveStudentsCount(activeCount);
    });

    return () => unsubscribe();
  }, [user, currentCommunity]);"""
replacement3 = """  useEffect(() => {
    if (!user) return;
    
    const fetchActiveCount = async () => {
      try {
        let q;
        if (currentCommunity === 'Both') {
           q = query(collection(db, 'study_sessions'), where('isStudying', '==', true));
        } else if (currentCommunity === 'Board') {
           q = query(collection(db, 'study_sessions'), where('isStudying', '==', true), where('communityType', '==', 'Board'));
        } else {
           q = query(collection(db, 'study_sessions'), where('isStudying', '==', true), where('communityType', 'in', ['JEE', null]));
        }
        
        const countSnap = await getCountFromServer(q);
        setActiveStudentsCount(countSnap.data().count);
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchActiveCount();
    const interval = setInterval(fetchActiveCount, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [user, currentCommunity]);"""
if target3 in content:
    content = content.replace(target3, replacement3)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
