import re

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'const unsubSession = onSnapshot.*?return \(\) => \{ unsubSession\(\); unsubStats\(\); \};', 
"""const fetchCampusData = async () => {
      try {
        const sessionSnap = await getDoc(doc(db, "study_sessions", user.uid));
        if (sessionSnap.exists()) {
          setMySession(sessionSnap.data());
        } else {
          setMySession(null);
        }
        
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
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
    
    fetchCampusData();""", content, flags=re.DOTALL)

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(content)
