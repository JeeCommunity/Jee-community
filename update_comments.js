import fs from 'fs';
let code = fs.readFileSync('src/components/CommentsModal.tsx', 'utf8');

const regex = /const fetchComments = async \(\) => \{[\s\S]*?fetchComments\(\);\s*return \(\) => \{\s*document\.body\.style\.overflow = '';\s*\};\s*\}, \[isOpen, post\.id\]\);/;

const replacement = `const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      // Sort newest first
      fetchedComments.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        if (a.createdAt.toMillis && b.createdAt.toMillis) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
      });
      
      setComments(fetchedComments);
    });

    return () => {
      document.body.style.overflow = '';
      unsubscribe();
    };
  }, [isOpen, post.id]);`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CommentsModal.tsx', code);
    console.log('Regex replace success');
} else {
    console.log('Failed completely');
}
