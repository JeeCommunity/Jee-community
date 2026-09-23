import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Add hasCreatedGroup
content = content.replace('const [joinCode, setJoinCode] = useState("");', 'const [joinCode, setJoinCode] = useState("");\n  const hasCreatedGroup = groups.some(g => g.creatorId === user?.uid);')

# Replace create group button area
create_button_search = """        <div className="flex-1">
          {!isCreating ? (
            <button onClick={() => setIsCreating(true)} className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
              <Plus className="w-4 h-4" /> Create Group
            </button>
          ) : ("""

create_button_replace = """        <div className="flex-1">
          {hasCreatedGroup ? (
            <div className="w-full text-center py-3 px-4 bg-slate-50 text-slate-400 rounded-xl font-medium text-sm border border-slate-100">
              You've created your group
            </div>
          ) : !isCreating ? (
            <button onClick={() => setIsCreating(true)} className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
              <Plus className="w-4 h-4" /> Create Group
            </button>
          ) : ("""

content = content.replace(create_button_search, create_button_replace)

# Add invite banner inside group
banner_search = """        <div className="p-4">
          <div className="space-y-0">
            {groupMembers.length === 0 ? ("""

banner_replace = """        <div className="p-4">
          {groupMembers.length <= 1 && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 text-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-slate-800 font-bold mb-1">Invite your friends!</h3>
              <p className="text-slate-500 text-sm mb-4">Share this code with your friends so they can join your study room.</p>
              <div className="flex items-center justify-center gap-2">
                <div className="bg-white border border-indigo-100 px-4 py-2 rounded-lg font-mono font-bold text-indigo-600 tracking-wider">
                  {activeGroup.shortCode}
                </div>
                <button onClick={() => {
                  navigator.clipboard.writeText(activeGroup.shortCode);
                  toast.success("Code copied!");
                }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                  <Copy className="w-4 h-4" /> Copy Code
                </button>
              </div>
            </div>
          )}
          <div className="space-y-0">
            {groupMembers.length === 0 ? ("""

content = content.replace(banner_search, banner_replace)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

