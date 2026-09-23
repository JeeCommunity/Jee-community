const fs = require('fs');
const file = 'src/pages/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const importsTarget = `import { collection, query, getDocs, doc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';`;
const importsReplacement = `import { collection, query, getDocs, doc, deleteDoc, orderBy, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';`;
code = code.replace(importsTarget, importsReplacement);

const stateTarget = `const [broadcastLoading, setBroadcastLoading] = useState(false);`;
const stateReplacement = `const [broadcastLoading, setBroadcastLoading] = useState(false);
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
code = code.replace(stateTarget, stateReplacement);

const uiTarget = `<div className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Study Groups ({studyGroups.length})</h3>`;
const uiReplacement = `<div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Study Groups ({studyGroups.length})</h3>
              <button 
                onClick={handleBroadcastBotToAllGroups}
                disabled={broadcastingBot || studyGroups.length === 0}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                {broadcastingBot ? <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                Broadcast Chulbul Warning to ALL
              </button>
            </div>`;
if(code.includes(uiTarget)){
  code = code.replace(uiTarget, uiReplacement);
  fs.writeFileSync(file, code);
  console.log("AdminDashboard patched successfully!");
} else {
  console.log("Could not find uiTarget in AdminDashboard");
}
