import re

with open('src/components/CommentsModal.tsx', 'r') as f:
    content = f.read()

pattern1 = re.compile(r'  useEffect\(\(\) => \{\n    if \(\!isOpen\) return;\n\n    // Prevent body scroll when modal is open\n    document\.body\.style\.overflow = \'hidden\';\n\n    const q = query\(\n      collection\(db, \'comments\'\),\n      where\(\'postId\', \'==\', post\.id\)\n    \);\n    \n    const fetchComments = async \(\) => \{.*?\}\n  \}, \[isOpen, post\.id\]\);', re.DOTALL)
replacement1 = """  const fetchComments = async () => {
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

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    fetchComments();
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, post.id]);"""
content = pattern1.sub(replacement1, content)

with open('src/components/CommentsModal.tsx', 'w') as f:
    f.write(content)
