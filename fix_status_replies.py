import re

with open('src/pages/StatusReplies.tsx', 'r') as f:
    content = f.read()

target1 = """import { collection, query, orderBy, onSnapshot, doc, getDoc, limit } from 'firebase/firestore';"""
replacement1 = """import { collection, query, orderBy, getDocs, doc, getDoc, limit } from 'firebase/firestore';"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """  useEffect(() => {
    if (!isAdmin) return;
    
    const q = query(collection(db, 'status_replies'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setReplies(data);
      
      // Fetch statuses that are referenced
      const statusIds = [...new Set(data.map(r => r.statusId))];
      const statusData: Record<string, any> = {};
      
      for (const id of statusIds) {
        if (!statuses[id]) {
          try {
            const s = await getDoc(doc(db, 'admin_statuses', id));
            if (s.exists()) {
              statusData[id] = s.data();
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      
      if (Object.keys(statusData).length > 0) {
         setStatuses(prev => ({...prev, ...statusData}));
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);"""
replacement2 = """  const fetchReplies = async () => {
    if (!isAdmin) return;
    
    const q = query(collection(db, 'status_replies'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    setReplies(data);
    
    // Fetch statuses that are referenced
    const statusIds = [...new Set(data.map(r => r.statusId))];
    const statusData: Record<string, any> = {};
    
    for (const id of statusIds) {
      if (!statuses[id]) {
        try {
          const s = await getDoc(doc(db, 'admin_statuses', id));
          if (s.exists()) {
            statusData[id] = s.data();
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    
    if (Object.keys(statusData).length > 0) {
       setStatuses(prev => ({...prev, ...statusData}));
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [isAdmin]);"""
if target2 in content:
    content = content.replace(target2, replacement2)

with open('src/pages/StatusReplies.tsx', 'w') as f:
    f.write(content)
