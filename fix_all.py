import re

def rewrite_layout():
    with open('src/components/Layout.tsx', 'r') as f:
        content = f.read()
        
    content = content.replace("import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';", "import { doc, collection, query, where, getDoc, getCountFromServer } from 'firebase/firestore';")
    
    pattern1 = re.compile(r'const unsubSession = onSnapshot.*?return \(\) => \{ unsubSession\(\); unsubStats\(\); \};', re.DOTALL)
    repl1 = """const fetchUserData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "study_sessions", user.uid));
        if (docSnap.exists()) {
          setMySession(docSnap.data());
        } else {
          setMySession(null);
        }
        
        const statsSnap = await getDoc(doc(db, "users", user.uid));
        if (statsSnap.exists()) {
          const data = statsSnap.data();
          if (data.campus) {
            setCampusStats({
              totalXP: data.campus.totalXP || 0,
              totalCoins: data.campus.totalCoins || 0
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserData();"""
    content = pattern1.sub(repl1, content)
    
    pattern2 = re.compile(r'const unsubscribe = onSnapshot.*?return \(\) => unsubscribe\(\);', re.DOTALL)
    repl2 = """const fetchActiveCount = async () => {
      try {
        let q;
        if (currentCommunity === 'Both') {
           q = query(collection(db, 'study_sessions'), where('isStudying', '==', true));
        } else if (currentCommunity === 'Board') {
           q = query(collection(db, 'study_sessions'), where('isStudying', '==', true), where('communityType', '==', 'Board'));
        } else {
           q = query(collection(db, 'study_sessions'), where('isStudying', '==', true), where('communityType', 'in', ['JEE', null]));
        }
        
        const countSnap = await getCountFromServer(q);
        setActiveStudentsCount(countSnap.data().count);
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchActiveCount();
    const interval = setInterval(fetchActiveCount, 60000); // Poll every minute
    return () => clearInterval(interval);"""
    content = pattern2.sub(repl2, content)

    with open('src/components/Layout.tsx', 'w') as f:
        f.write(content)

rewrite_layout()
