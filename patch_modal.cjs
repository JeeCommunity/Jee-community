const fs = require('fs');
const file = 'src/components/AdminStudyGroupModal.tsx';
let code = fs.readFileSync(file, 'utf8');

const importsTarget = `import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';`;
const importsReplacement = `import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';`;
code = code.replace(importsTarget, importsReplacement);

const stateTarget = `const [loading, setLoading] = useState(true);`;
const stateReplacement = `const [loading, setLoading] = useState(true);
  const [botMessage, setBotMessage] = useState("");
  const [sendingBot, setSendingBot] = useState(false);

  const handleSendBotMessage = async (e) => {
    e.preventDefault();
    if (!botMessage.trim() || !group?.id) return;
    
    setSendingBot(true);
    try {
      await addDoc(collection(db, 'study_groups', group.id, 'messages'), {
        text: botMessage.trim(),
        userId: 'inspector-chulbul-bot',
        userName: 'Inspector Chulbul 👮‍♂️',
        userPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=chulbul&backgroundColor=fca5a5',
        createdAt: serverTimestamp(),
        type: 'text',
        isBot: true,
        isToxic: false
      });
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: botMessage.trim(),
        userId: 'inspector-chulbul-bot',
        userName: 'Inspector Chulbul 👮‍♂️',
        userPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=chulbul&backgroundColor=fca5a5',
        createdAt: { toDate: () => new Date() },
        type: 'text',
        isBot: true,
        isToxic: false
      }]);
      setBotMessage("");
    } catch (err) {
      console.error("Error sending bot message:", err);
    } finally {
      setSendingBot(false);
    }
  };`;
code = code.replace(stateTarget, stateReplacement);

const mapTarget = `(msg) => (
              <div key={msg.id} className={\`p-3 rounded-xl border shadow-sm max-w-[85%] \${msg.isToxic ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}\`}>`;
const mapReplacement = `(msg) => (
              <div key={msg.id} className={\`p-3 rounded-xl border shadow-sm max-w-[85%] \${msg.isToxic ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} \${msg.userId === 'inspector-chulbul-bot' ? 'bg-red-50/50 border-red-200 self-center max-w-[95%] shadow-md' : ''}\`}>`;
code = code.replace(mapTarget, mapReplacement);

const nameTarget = `<span className="font-bold text-slate-900 dark:text-white text-sm">{msg.userName}</span>`;
const nameReplacement = `<span className={\`font-bold text-sm \${msg.userId === 'inspector-chulbul-bot' ? 'text-red-600' : 'text-slate-900 dark:text-white'}\`}>{msg.userName}</span>`;
code = code.replace(nameTarget, nameReplacement);

const endTarget = `        </div>
      </div>
    </div>`;
const endReplacement = `        </div>
        
        {/* Bot Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSendBotMessage} className="flex gap-2">
            <div className="flex-1 relative">
               <input
                 type="text"
                 value={botMessage}
                 onChange={(e) => setBotMessage(e.target.value)}
                 placeholder="Send message as Inspector Chulbul..."
                 className="w-full pl-4 pr-[80px] py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/50 outline-none"
               />
               <button 
                 type="button" 
                 onClick={() => setBotMessage("Hello! Mera name Inspector Chulbul hai 👮‍♂️ aur mera kaam hai groups ko manage karna. Is group me harassment/spam ho raha hai. Ise stop karein warna GC delete ho jayegi! 🚨")}
                 className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-red-100 text-red-600 px-2 py-1.5 rounded font-bold hover:bg-red-200 transition"
                 title="Quick Warning Template"
               >
                 TEMPLATE
               </button>
            </div>
            <button
              type="submit"
              disabled={!botMessage.trim() || sendingBot}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 min-w-[120px]"
            >
              {sendingBot ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Warning"}
            </button>
          </form>
        </div>
      </div>
    </div>`;
code = code.replace(endTarget, endReplacement);

fs.writeFileSync(file, code);
console.log("Patched AdminStudyGroupModal");
