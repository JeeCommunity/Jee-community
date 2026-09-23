import re

with open('src/components/GlobalStudyNotifier.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';", "import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';")

# We'll just replace the useEffect content.
match = re.search(r'useEffect\(\(\) => \{.*?\n  \}, \[user\]\);', content, re.DOTALL)
if match:
    new_use_effect = """useEffect(() => {
    if (!user) return;
    
    const fetchNotifier = async () => {
      const q = query(collection(db, 'study_sessions'), orderBy('lastUpdated', 'desc'), limit(20));
      try {
        const snapshot = await getDocs(q);
        if (initialLoadRef.current) {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.uid) {
              previousStateRef.current.set(data.uid, data.isStudying === true);
            }
          });
          initialLoadRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          if (!data.uid || data.uid === user.uid) return;

          const isCurrentlyStudying = data.isStudying === true;
          const wasStudying = previousStateRef.current.get(data.uid);

          if (isCurrentlyStudying && !wasStudying) {
            setLatestSession(data);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              setLatestSession(null);
            }, 5000);
          }

          previousStateRef.current.set(data.uid, isCurrentlyStudying);
        });
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchNotifier();
    const interval = setInterval(fetchNotifier, 60000);
    return () => clearInterval(interval);
  }, [user]);"""
    content = content[:match.start()] + new_use_effect + content[match.end():]

with open('src/components/GlobalStudyNotifier.tsx', 'w') as f:
    f.write(content)
