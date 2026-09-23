import sys

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

target = """          <div className="flex items-center space-x-0.5">
            
            <button onClick={toggleTheme} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationsDropdown />

            <Link to="/study-room" className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 mr-2">
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
                <span className="text-xs font-bold">{Math.floor(liveCoins).toLocaleString()}</span>
              </div>
              <div className={`w-px h-3 ${isCampus ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <div className="flex items-center gap-1">
                <Zap className={`w-3.5 h-3.5 ${isCampus ? 'text-blue-400' : 'text-blue-500'} fill-current`} />
                <span className="text-xs font-bold text-[11px]">Lvl {currentLevel}</span>
              </div>
            </Link>
          </div>"""

replacement = """          <div className="flex items-center space-x-1">
            <NotificationsDropdown />
            <Link to="/campus" className={`flex items-center gap-1.5 px-2 py-1 ${isCampus ? 'bg-[#0A101D]/80 border border-white/5 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'} rounded-full cursor-pointer`}>
              <div className="flex items-center gap-1">
                <Star className={`w-3 h-3 ${isCampus ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                <span className="text-[11px] font-bold">{Math.floor(liveCoins).toLocaleString()}</span>
              </div>
              <div className={`w-px h-3 ${isCampus ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <div className="flex items-center gap-1">
                <Zap className={`w-3 h-3 ${isCampus ? 'text-blue-400' : 'text-blue-500'} fill-current`} />
                <span className="text-[10px] font-bold">Lvl {currentLevel}</span>
              </div>
            </Link>
          </div>"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced successfully!")
else:
    print("Not found target!")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

