import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = 'import PrivateStudyGroups from "../components/PrivateStudyGroups";\n'
content = content.replace('import UserProfileModal from "../components/UserProfileModal";', import_str + 'import UserProfileModal from "../components/UserProfileModal";')

# Add activeTab state
state_str = '  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");\n  const [cheerCooldowns, setCheerCooldowns]'
content = content.replace('  const [cheerCooldowns, setCheerCooldowns]', state_str)

# Add Tab UI
tab_ui = """      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 mb-6">
        <button 
          onClick={() => setActiveTab('global')}
          className={cn("flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors", activeTab === 'global' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50")}
        >
          Global Study Room
        </button>
        <button 
          onClick={() => setActiveTab('friends')}
          className={cn("flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors", activeTab === 'friends' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50")}
        >
          Study with Friends
        </button>
      </div>

"""

content = content.replace('      {/* Focus Tracker */}', tab_ui + '      {/* Focus Tracker */}')

# Conditionally render Leaderboard or PrivateStudyGroups
# Find Leaderboard section
lb_section_start = """      {/* Study Room (Leaderboard) */}
      <div className="bg-white rounded-[24px] p-2 sm:p-6 shadow-sm border border-slate-100">"""

lb_section_replacement = """      {/* Conditionally Render Room */}
      {activeTab === 'global' ? (
        <div className="bg-white rounded-[24px] p-2 sm:p-6 shadow-sm border border-slate-100">"""

content = content.replace(lb_section_start, lb_section_replacement)

# We need to close the ternary at the end of Leaderboard
lb_section_end = """        </div>
      </div>

      {selectedUserForProfile && ("""

lb_section_end_replacement = """        </div>
        </div>
      ) : (
        <PrivateStudyGroups sessions={sessions} getSessionTime={getSessionTime} formatTime={formatTime} handleUserClick={handleUserClick} />
      )}

      {selectedUserForProfile && ("""

content = content.replace(lb_section_end, lb_section_end_replacement)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

