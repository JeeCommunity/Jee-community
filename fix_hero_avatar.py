import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Add Pencil to imports
content = content.replace(
    "CheckCircle2, Circle, Settings",
    "CheckCircle2, Circle, Settings, Pencil"
)

old_hero = """                           <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/20 mb-5 relative overflow-hidden group">
                             {activeGroup.photoURL ? <img src={activeGroup.photoURL} alt={activeGroup.name} className="w-full h-full object-cover" /> : activeGroup.name.charAt(0).toUpperCase()}
                             <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm border border-slate-100 z-10">
                                <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></div>
                             </div>
                             {user?.uid === activeGroup.creatorId && (
                               <div onClick={() => { setEditGroupName(activeGroup.name); setEditGroupPhoto(activeGroup.photoURL || ""); setIsEditingGroup(true); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                 <Settings className="w-6 h-6 text-white" />
                               </div>
                             )}
                           </div>"""

new_hero = """                           <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/20 mb-5 relative group">
                             <div className="w-full h-full rounded-3xl overflow-hidden">
                               {activeGroup.photoURL ? <img src={activeGroup.photoURL} alt={activeGroup.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{activeGroup.name.charAt(0).toUpperCase()}</div>}
                             </div>
                             
                             {user?.uid === activeGroup.creatorId && (
                               <>
                                 <div 
                                   onClick={() => { setEditGroupName(activeGroup.name); setEditGroupPhoto(activeGroup.photoURL || ""); setIsEditingGroup(true); }}
                                   className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-slate-100 z-10 cursor-pointer text-blue-600 hover:text-blue-700 hover:scale-110 transition-all"
                                 >
                                    <Pencil className="w-4 h-4" />
                                 </div>
                                 <div onClick={() => { setEditGroupName(activeGroup.name); setEditGroupPhoto(activeGroup.photoURL || ""); setIsEditingGroup(true); }} className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm z-0">
                                   <Pencil className="w-6 h-6 text-white" />
                                 </div>
                               </>
                             )}
                           </div>"""

content = content.replace(old_hero, new_hero)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

