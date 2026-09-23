import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """        <button 
          onClick={() => {
            if (isAdmin) setActiveTab('groups');
            else toast("Study with Friends is upcoming!");
          }}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2",
            activeTab === 'groups' ? "bg-indigo-600 text-white shadow-md" : 
            isAdmin ? "text-slate-500 hover:bg-slate-50 cursor-pointer" : "text-slate-400 cursor-not-allowed"
          )}
        >
          Study with Friends
          {!isAdmin && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Upcoming</span>}
        </button>"""

replacement = """        <button 
          onClick={() => setActiveTab('groups')}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2",
            activeTab === 'groups' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 cursor-pointer"
          )}
        >
          Study with Friends
        </button>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/LiveStudy.tsx', 'w') as f:
        f.write(content)
    print("Study with Friends enabled for all.")
else:
    print("Could not find target block.")
