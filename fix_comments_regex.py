import re

with open('src/components/CommentsModal.tsx', 'r') as f:
    content = f.read()

match = re.search(r'    const unsubscribe = onSnapshot\(q, \(snapshot\) => \{.*?return \(\) => unsubscribe\(\);\n  \}, \[isOpen, post\.id\]\);', content, re.DOTALL)
if match:
    repl = """    const fetchComments = async () => {
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
  }, [isOpen, post.id]);"""
    content = content[:match.start()] + repl + content[match.end():]

with open('src/components/CommentsModal.tsx', 'w') as f:
    f.write(content)
