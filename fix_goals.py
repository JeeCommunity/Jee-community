import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Update imports
content = content.replace(
    "import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Pin, Reply, X, Clock, Play } from 'lucide-react';",
    "import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Pin, Reply, X, Clock, Play, Target, CheckCircle2, Circle } from 'lucide-react';"
)
content = content.replace(
    'import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, orderBy, addDoc } from \'firebase/firestore\';',
    'import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, orderBy, addDoc } from \'firebase/firestore\';'
)

# Update state for tab
content = content.replace(
    "const [activeGroupTab, setActiveGroupTab] = useState<\"home\" | \"chat\" | \"members\">(\"home\");",
    "const [activeGroupTab, setActiveGroupTab] = useState<\"home\" | \"chat\" | \"members\" | \"goals\">(\"home\");\n  const [goalInput, setGoalInput] = useState(\"\");"
)

# Add addGoal function to PrivateStudyGroups
add_goal_func = """
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || !user) return;
    
    try {
      const newGoal = {
        id: Date.now().toString(),
        text: goalInput.trim(),
        status: "pending",
        createdAt: Date.now(),
      };
      
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      
      // Simple logic since this mirrors LiveStudy behavior vaguely 
      // (LiveStudy actually handles date-based sub-logic, but just appending to goals array will show it globally)
      if (snap.exists()) {
         const currentGoals = snap.data().goals || [];
         await updateDoc(ref, {
           goals: [...currentGoals, newGoal]
         });
      }
      setGoalInput("");
      toast.success("Goal added!");
    } catch (err) {
      toast.error("Error adding goal");
    }
  };
  
  const handleToggleGoal = async (goalId: string, currentStatus: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "study_sessions", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
         const currentGoals = snap.data().goals || [];
         const updatedGoals = currentGoals.map((g: any) => 
           g.id === goalId ? { ...g, status: currentStatus === "completed" ? "pending" : "completed" } : g
         );
         await updateDoc(ref, { goals: updatedGoals });
      }
    } catch (err) {
      toast.error("Error updating goal");
    }
  };
"""

content = content.replace(
    "const handleSendMessage = async (e: React.FormEvent) => {",
    add_goal_func + "\n  const handleSendMessage = async (e: React.FormEvent) => {"
)

# Update Desktop Sidebar navigation
desktop_nav = """             <button onClick={() => setActiveGroupTab('members')} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all", activeGroupTab === 'members' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
               <Users className="w-4 h-4" /> Members
             </button>
             <button onClick={() => setActiveGroupTab('goals')} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all", activeGroupTab === 'goals' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
               <Target className="w-4 h-4" /> Goals
             </button>"""
content = content.replace(
    """             <button onClick={() => setActiveGroupTab('members')} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all", activeGroupTab === 'members' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>\n               <Users className="w-4 h-4" /> Members\n             </button>""",
    desktop_nav
)

# Update Mobile Navigation
mobile_nav = """              <button onClick={() => setActiveGroupTab('members')} className={cn("flex flex-col items-center gap-1 p-2 w-16 transition-colors", activeGroupTab === 'members' ? "text-blue-600" : "text-slate-400")}>
                 <Users className={cn("w-5 h-5", activeGroupTab === 'members' && "fill-blue-600/20")} />
                 <span className="text-[10px] font-bold">Members</span>
              </button>
              <button onClick={() => setActiveGroupTab('goals')} className={cn("flex flex-col items-center gap-1 p-2 w-16 transition-colors", activeGroupTab === 'goals' ? "text-blue-600" : "text-slate-400")}>
                 <Target className={cn("w-5 h-5", activeGroupTab === 'goals' && "fill-blue-600/20")} />
                 <span className="text-[10px] font-bold">Goals</span>
              </button>"""
content = content.replace(
    """              <button onClick={() => setActiveGroupTab('members')} className={cn("flex flex-col items-center gap-1 p-2 w-16 transition-colors", activeGroupTab === 'members' ? "text-blue-600" : "text-slate-400")}>\n                 <Users className={cn("w-5 h-5", activeGroupTab === 'members' && "fill-blue-600/20")} />\n                 <span className="text-[10px] font-bold">Members</span>\n              </button>""",
    mobile_nav
)

# Add Goals tab content
goals_tab_content = """
              {/* GOALS TAB */}
              {activeGroupTab === 'goals' && (
                 <div className="p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                       <div>
                         <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                           <Target className="w-5 h-5 text-blue-500" /> Group Goals
                         </h3>
                         <p className="text-sm text-slate-500 mt-1">See what everyone is working on.</p>
                       </div>
                       
                       <form onSubmit={handleAddGoal} className="flex items-center gap-2 w-full md:w-auto">
                          <input 
                             type="text" 
                             value={goalInput}
                             onChange={(e) => setGoalInput(e.target.value)}
                             placeholder="Set a new goal..."
                             className="flex-1 md:w-64 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                          <button type="submit" disabled={!goalInput.trim()} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                             Add
                          </button>
                       </form>
                    </div>
                    
                    <div className="space-y-6">
                       {groupMembers.filter((m: any) => m.goals && m.goals.length > 0).length === 0 ? (
                          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                             <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                             <h4 className="font-bold text-slate-700">No active goals</h4>
                             <p className="text-slate-500 text-sm">Members haven't set any goals today.</p>
                          </div>
                       ) : (
                          groupMembers.filter((m: any) => m.goals && m.goals.length > 0).map((s: any) => {
                             const isMe = s.id === user?.uid;
                             return (
                                <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                   <div className="flex items-center gap-3 mb-4">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                         {(s.photoURL || s.userPhoto) ? <img src={s.photoURL || s.userPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{getFirstName(s.fullName || s.userName || "U").charAt(0).toUpperCase()}</div>}
                                      </div>
                                      <div className="font-bold text-slate-800 text-sm">{s.fullName || s.userName || "Unknown"}</div>
                                      {isMe && <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-100 ml-auto">You</span>}
                                   </div>
                                   
                                   <div className="space-y-2">
                                      {s.goals.map((g: any) => {
                                         const isActive = s.isStudying && s.activeGoalId === g.id;
                                         const isCompleted = g.status === 'completed';
                                         
                                         return (
                                            <div key={g.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 group transition-all hover:bg-slate-100/50">
                                               {isMe ? (
                                                  <button onClick={() => handleToggleGoal(g.id, g.status)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
                                                     {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />}
                                                  </button>
                                               ) : (
                                                  <div className="mt-0.5 shrink-0">
                                                     {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                                                  </div>
                                               )}
                                               
                                               <div className="flex-1 min-w-0">
                                                  <div className={cn("text-[15px] font-medium leading-snug transition-colors", isCompleted ? "text-slate-400 line-through" : "text-slate-700")}>
                                                     {g.text}
                                                  </div>
                                                  {isActive && (
                                                     <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                        Currently Working On
                                                     </div>
                                                  )}
                                               </div>
                                            </div>
                                         )
                                      })}
                                   </div>
                                </div>
                             )
                          })
                       )}
                    </div>
                 </div>
              )}
"""

content = content.replace(
    "           </div>\n\n           {/* MOBILE BOTTOM NAVIGATION */}",
    goals_tab_content + "\n           </div>\n\n           {/* MOBILE BOTTOM NAVIGATION */}"
)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

