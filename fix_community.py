import re

with open('src/pages/Community.tsx', 'r') as f:
    content = f.read()

target1 = """import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';"""
replacement1 = """import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [user]);"""
replacement2 = """  const fetchPosts = async () => {
    if (!user) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPosts(postsData);
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);"""
if target2 in content:
    content = content.replace(target2, replacement2)

target3 = """  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };"""
replacement3 = """  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
  };"""
if target3 in content:
    content = content.replace(target3, replacement3)

target4 = """          <CreatePostModal
             isOpen={isModalOpen}
             onClose={() => setIsModalOpen(false)}
             onSuccess={() => {}}"""
replacement4 = """          <CreatePostModal
             isOpen={isModalOpen}
             onClose={() => setIsModalOpen(false)}
             onSuccess={() => { fetchPosts(); }}"""
if target4 in content:
    content = content.replace(target4, replacement4)

with open('src/pages/Community.tsx', 'w') as f:
    f.write(content)
