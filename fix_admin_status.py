import re

with open('src/components/AdminStatusRow.tsx', 'r') as f:
    content = f.read()

target2 = """  useEffect(() => {
    if (!user) return;
    // Fetch last 10 statuses
    const q = query(collection(db, 'admin_statuses'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStatuses(data);
    });
    return () => unsubscribe();
  }, [user]);"""
replacement2 = """  const fetchStatuses = async () => {
    if (!user) return;
    const q = query(collection(db, 'admin_statuses'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStatuses(data);
  };

  useEffect(() => {
    fetchStatuses();
  }, [user]);"""

if target2 in content:
    content = content.replace(target2, replacement2)
else:
    print("target2 not found")

with open('src/components/AdminStatusRow.tsx', 'w') as f:
    f.write(content)
