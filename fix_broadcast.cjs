const fs = require('fs');
const file = 'src/pages/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const importsTarget = `import { collection, query, orderBy, doc, deleteDoc, getDocs, updateDoc, where, limit, getCountFromServer, startAfter, or } from 'firebase/firestore';`;
const importsReplacement = `import { collection, query, orderBy, doc, deleteDoc, getDocs, updateDoc, where, limit, getCountFromServer, startAfter, or, addDoc, serverTimestamp } from 'firebase/firestore';`;
if (code.includes(importsTarget)) {
   code = code.replace(importsTarget, importsReplacement);
}

const stateTarget = `const [usersHasMore, setUsersHasMore] = useState<boolean>(true);`;
const stateReplacement = `const [usersHasMore, setUsersHasMore] = useState<boolean>(true);
  const [broadcastingBot, setBroadcastingBot] = useState(false);

  const handleBroadcastBotToAllGroups = async () => {
    if (!studyGroups || studyGroups.length === 0) return;
    if (!confirm("Are you sure you want to send Inspector Chulbul warning to ALL Study Groups?")) return;
    
    setBroadcastingBot(true);
    try {
      const promises = studyGroups.map(group => 
        addDoc(collection(db, 'study_groups', group.id, 'messages'), {
          text: "Hello! Mera name Inspector Chulbul hai 👮‍♂️ aur mera kaam hai groups ko manage karna. Sabhi GCs par meri nazar hai. Padhai ke alawa koi spam ya harassment hua toh GC permanent delete ho jayegi! 🚨",
          userId: 'inspector-chulbul-bot',
          userName: 'Inspector Chulbul 👮‍♂️',
          userPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=chulbul&backgroundColor=fca5a5',
          createdAt: serverTimestamp(),
          type: 'text',
          isBot: true,
          isToxic: false
        })
      );
      await Promise.all(promises);
      toast.success(\`Warning sent to \${studyGroups.length} groups!\`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to broadcast warning");
    } finally {
      setBroadcastingBot(false);
    }
  };`;
if (code.includes(stateTarget)) {
   code = code.replace(stateTarget, stateReplacement);
}

fs.writeFileSync(file, code);
console.log("Fixed missing function");
