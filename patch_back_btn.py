import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

old_mobile_back = """                <button onClick={() => setActiveGroup(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </button>"""
new_mobile_back = """                <button onClick={() => {
                   if (activeGroupTab !== 'chat') setActiveGroupTab('chat');
                   else setActiveGroup(null);
                }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </button>"""

content = content.replace(old_mobile_back, new_mobile_back)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
