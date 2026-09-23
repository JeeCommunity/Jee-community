import re

with open('src/components/LeaderboardWidget.tsx', 'r') as f:
    content = f.read()

target1 = """import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';"""
replacement1 = """import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('reputation', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaders(data);
    });
    return () => unsubscribe();
  }, [user]);"""
replacement2 = """  const fetchLeaders = async () => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('reputation', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setLeaders(data);
  };

  useEffect(() => {
    fetchLeaders();
  }, [user]);"""
if target2 in content:
    content = content.replace(target2, replacement2)

with open('src/components/LeaderboardWidget.tsx', 'w') as f:
    f.write(content)
