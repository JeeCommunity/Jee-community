import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

old_list_avatar = """                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                   {g.name.charAt(0).toUpperCase()}
                 </div>"""

new_list_avatar = """                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden">
                   {g.photoURL ? <img src={g.photoURL} alt={g.name} className="w-full h-full object-cover" /> : g.name.charAt(0).toUpperCase()}
                 </div>"""

content = content.replace(old_list_avatar, new_list_avatar)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

