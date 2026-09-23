import re

with open('src/components/CommentsModal.tsx', 'r') as f:
    content = f.read()

target1 = """  onSnapshot,"""
replacement1 = """  getDocs,"""
if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """    const q = query(
      collection(db, 'comments'),
      where('postId', '==', post.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      // Sort newest first
      fetchedComments.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      
      setComments(fetchedComments);
    });

    return () => unsubscribe();"""
replacement2 = """    const fetchComments = async () => {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', post.id)
      );
      
      const snapshot = await getDocs(q);
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      // Sort newest first
      fetchedComments.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      
      setComments(fetchedComments);
    };

    fetchComments();"""
if target2 in content:
    content = content.replace(target2, replacement2)

target3 = """      // update local comment state if needed, though onSnapshot might handle it"""
replacement3 = """      // update local comment state since we are no longer using onSnapshot"""
if target3 in content:
    content = content.replace(target3, replacement3)

with open('src/components/CommentsModal.tsx', 'w') as f:
    f.write(content)
