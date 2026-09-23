import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ShieldAlert } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getToxicWords } from '../lib/moderation';

interface AdminStudyGroupModalProps {
  group: any;
  onClose: () => void;
}

export default function AdminStudyGroupModal({ group, onClose }: AdminStudyGroupModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        userPhoto: '/chulbul.png',
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
        userPhoto: '/chulbul.png',
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
  };

  useEffect(() => {
    if (!group?.id) return;
    const fetchMessages = async () => {
      try {
        const q = query(
          collection(db, 'study_groups', group.id, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => {
          const data = doc.data();
          // Retroactive Live Scan (In-memory, Zero DB Writes!)
          if (!data.isToxic && data.text) {
             const toxicWords = getToxicWords(data.text);
             if (toxicWords.length > 0) {
               data.isToxic = true;
               data.toxicWords = toxicWords;
             }
          }
          return { id: doc.id, ...data };
        });
        // Reverse so chronological order
        setMessages(fetched.reverse());
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [group]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-500" />
            Ghost Mode: {group.name} ({group.shortCode})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No messages in this group yet.
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.userId === 'inspector-chulbul-bot') {
                return (
                 <div key={msg.id} className="flex flex-col w-full my-6">
                   <div className="flex items-start gap-3 md:gap-4 group relative w-full px-2">
                     <div className="w-24 md:w-32 shrink-0 relative z-20 animate-[bounce_2s_ease-in-out_infinite]">
                       <img src="/chulbul.png" alt="Chulbul" className="w-full h-auto object-contain drop-shadow-2xl" />
                     </div>
                     <div className="bg-white border-2 border-red-500 text-red-900 px-5 py-4 rounded-3xl shadow-xl z-10 flex-1 relative animate-[pulse_3s_ease-in-out_infinite] mt-2 md:mt-4">
                       <div className="absolute -left-[11px] top-6 w-5 h-5 bg-white border-l-2 border-b-2 border-red-500 transform rotate-45 rounded-bl-sm z-10"></div>
                       <div className="flex items-center gap-2 mb-2">
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                          <span className="font-black text-red-700 block text-base uppercase tracking-wider">{msg.userName}</span>
                       </div>
                       {msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all text-[14px] font-bold text-slate-800" style={{ wordBreak: 'break-word' }}>{msg.text}</div>}
                       <div className="text-[10px] text-right font-bold text-slate-400 mt-2">
                           {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                       </div>
                     </div>
                   </div>
                 </div>
                );
              }

              return (
              <div key={msg.id} className={`p-3 rounded-xl border shadow-sm max-w-[85%] ${msg.isToxic ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {msg.userPhoto ? (
                    <img src={msg.userPhoto} alt={msg.userName} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                      {msg.userName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className={`font-bold text-sm ${msg.userId === 'inspector-chulbul-bot' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{msg.userName}</span>
                  <span className="text-[10px] text-slate-500">
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : ''}
                  </span>
                </div>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="attached" className="max-w-full rounded-lg mb-2" />
                )}
                {msg.text && (
                  <p className="text-slate-700 dark:text-slate-300 text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                )}
                {msg.isToxic && msg.toxicWords && msg.toxicWords.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-100 dark:border-red-900/30 flex items-start gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Flagged Words:</span>
                      {msg.toxicWords.map((w: string, i: number) => (
                        <span key={i} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-md font-bold">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )})
          )}
        </div>
        
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
    </div>
  );
}
