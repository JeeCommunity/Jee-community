import sys
import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Replace Mobile Header Icons
target_mobile = """            <Link to="/community" className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
              <Home className="w-5 h-5" />
            </Link>
            <Link to="/study-room" className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
              <MonitorPlay className="w-5 h-5" />
              {activeStudentsCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none z-10">
                  <span className="w-1 h-1 bg-white dark:bg-slate-900 rounded-full mr-0.5 animate-pulse"></span>
                  {activeStudentsCount}
                </span>
              )}
            </Link>
            <Link to="/relax-hub" className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-purple-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                <Headphones className="w-5 h-5" />
              </Link>
              <Link to="/notes-hub" className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
              <FileText className="w-5 h-5" />
            </Link>"""

replacement_mobile = """            <Link to="/study-room" className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 mr-2">
              <MonitorPlay className="w-5 h-5" />
              {activeStudentsCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none z-10">
                  <span className="w-1 h-1 bg-white dark:bg-slate-900 rounded-full mr-0.5 animate-pulse"></span>
                  {activeStudentsCount}
                </span>
              )}
            </Link>
            <Link to="/campus" className={`flex items-center gap-2 px-2.5 py-1 ${isCampus ? 'bg-[#0A101D]/80 border border-white/5 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'} rounded-full cursor-pointer`}>
              <div className="flex items-center gap-1">
                <Star className={`w-3.5 h-3.5 ${isCampus ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                <span className="text-xs font-bold">{liveCoins.toLocaleString()}</span>
              </div>
              <div className={`w-px h-3 ${isCampus ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <div className="flex items-center gap-1">
                <Zap className={`w-3.5 h-3.5 ${isCampus ? 'text-blue-400' : 'text-blue-500'} fill-current`} />
                <span className="text-xs font-bold text-[11px]">Lvl {currentLevel}</span>
              </div>
            </Link>"""

if target_mobile in content:
    content = content.replace(target_mobile, replacement_mobile)
else:
    print("Could not find target_mobile")

# Replace Desktop Header Icons
target_desktop = """              <Link 
                to="/relax-hub"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors flex items-center justify-center relative shrink-0"
                title="Relax Hub"
              >
                <Headphones className="w-5 h-5" />
              </Link>
              <Link 
                to="/notes-hub"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center relative shrink-0"
                title="Notes Hub"
              >
                <FileText className="w-5 h-5" />
              </Link>"""

replacement_desktop = """              <Link to="/campus" className={`flex items-center gap-3 px-4 py-1.5 ${isCampus ? 'bg-[#0A101D]/80 border border-white/5 text-white' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'} rounded-full hover:opacity-80 transition-opacity cursor-pointer mx-2`}>
                <div className="flex items-center gap-1.5">
                  <Star className={`w-4 h-4 ${isCampus ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                  <span className="text-sm font-bold">{liveCoins.toLocaleString()}</span>
                </div>
                <div className={`w-px h-4 ${isCampus ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-4 h-4 ${isCampus ? 'text-blue-400' : 'text-blue-500'} fill-current`} />
                  <span className="text-sm font-bold">Lvl {currentLevel}</span>
                </div>
              </Link>"""

if target_desktop in content:
    content = content.replace(target_desktop, replacement_desktop)
else:
    print("Could not find target_desktop")

# Profile Dropdown update
target_dropdown = """                    <button 
                      onClick={() => { setIsDropdownOpen(false); navigate('/setup-profile'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>"""

replacement_dropdown = """                    <button 
                      onClick={() => { setIsDropdownOpen(false); navigate('/setup-profile'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => { setIsDropdownOpen(false); navigate('/notes-hub'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Notes Hub
                    </button>
                    <button 
                      onClick={() => { setIsDropdownOpen(false); navigate('/relax-hub'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                    >
                      <Headphones className="w-4 h-4 mr-2" />
                      Relax Hub
                    </button>"""

if target_dropdown in content:
    content = content.replace(target_dropdown, replacement_dropdown)
else:
    print("Could not find target_dropdown")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

