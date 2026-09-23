import re

with open('src/components/CommentsModal.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r'    const unsubscribe = onSnapshot\(q, \(snapshot\) => \{.*?return \(\) => \{\n      document\.body\.style\.overflow = \'\';\n      unsubscribe\(\);\n    \};\n  \}, \[isOpen, post\.id\]\);', re.DOTALL)
replacement = """    const fetchComments = async () => {
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

    fetchComments();
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, post.id]);"""

content = pattern.sub(replacement, content)

with open('src/components/CommentsModal.tsx', 'w') as f:
    f.write(content)
