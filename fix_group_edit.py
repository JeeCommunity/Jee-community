import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Add icons
content = content.replace(
    "CheckCircle2, Circle",
    "CheckCircle2, Circle, Settings"
)

# Add state variables
content = content.replace(
    "const [joinCode, setJoinCode] = useState(\"\");",
    """const [joinCode, setJoinCode] = useState("");\n  const [isEditingGroup, setIsEditingGroup] = useState(false);\n  const [editGroupName, setEditGroupName] = useState("");\n  const [editGroupPhoto, setEditGroupPhoto] = useState("");"""
)

# Add handleUpdateGroup function
update_func = """
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroupName.trim() || !activeGroup || activeGroup.creatorId !== user?.uid) return;
    try {
      await updateDoc(doc(db, 'study_groups', activeGroup.shortCode), {
        name: editGroupName.trim(),
        photoURL: editGroupPhoto.trim() || null
      });
      toast.success("Group updated!");
      setIsEditingGroup(false);
      setActiveGroup({...activeGroup, name: editGroupName.trim(), photoURL: editGroupPhoto.trim() || null});
      fetchGroups();
    } catch (err) {
      toast.error("Error updating group");
    }
  };
"""
content = content.replace(
    "const handleSendMessage = async",
    update_func + "\n  const handleSendMessage = async"
)

# Replace group list avatar
content = content.replace(
    """<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">\n                   {g.name.charAt(0).toUpperCase()}\n                 </div>""",
    """<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 overflow-hidden">\n                   {g.photoURL ? <img src={g.photoURL} alt={g.name} className="w-full h-full object-cover" /> : g.name.charAt(0).toUpperCase()}\n                 </div>"""
)

# Replace active group sidebar avatar
content = content.replace(
    """             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">\n               {activeGroup.name.charAt(0).toUpperCase()}\n             </div>""",
    """             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden">\n               {activeGroup.photoURL ? <img src={activeGroup.photoURL} alt={activeGroup.name} className="w-full h-full object-cover" /> : activeGroup.name.charAt(0).toUpperCase()}\n             </div>"""
)

# Replace active group hero avatar and add edit button
hero_orig = """                       <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/20 mb-5 relative">\n                         {activeGroup.name.charAt(0).toUpperCase()}\n                         <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm border border-slate-100">\n                            <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></div>\n                         </div>\n                       </div>\n                       <h1 className="text-2xl font-black text-slate-800 mb-2">{activeGroup.name}</h1>"""
hero_new = """                       {isEditingGroup ? (
                         <div className="w-full max-w-sm mx-auto bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative mb-4">
                           <button onClick={() => setIsEditingGroup(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                             <X className="w-4 h-4" />
                           </button>
                           <h3 className="font-bold text-slate-800 mb-4 text-left text-sm">Edit Group</h3>
                           <form onSubmit={handleUpdateGroup} className="space-y-4 text-left">
                             <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Group Name</label>
                               <input type="text" value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Image URL (Optional)</label>
                               <input type="url" value={editGroupPhoto} onChange={(e) => setEditGroupPhoto(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                             </div>
                             <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-2 font-bold text-sm hover:bg-blue-700 transition-colors">Save Changes</button>
                           </form>
                         </div>
                       ) : (
                         <>
                           <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/20 mb-5 relative overflow-hidden group">
                             {activeGroup.photoURL ? <img src={activeGroup.photoURL} alt={activeGroup.name} className="w-full h-full object-cover" /> : activeGroup.name.charAt(0).toUpperCase()}
                             <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm border border-slate-100 z-10">
                                <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></div>
                             </div>
                             {user?.uid === activeGroup.creatorId && (
                               <div onClick={() => { setEditGroupName(activeGroup.name); setEditGroupPhoto(activeGroup.photoURL || ""); setIsEditingGroup(true); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                 <Settings className="w-6 h-6 text-white" />
                               </div>
                             )}
                           </div>
                           <h1 className="text-2xl font-black text-slate-800 mb-2">{activeGroup.name}</h1>
                         </>
                       )}"""
content = content.replace(hero_orig, hero_new)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

