import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r'<div className="flex items-center space-x-0\.5">.*?</div>\n        </header>', re.DOTALL)

replacement = """<div className="flex items-center space-x-1">
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
          </div>
        </header>"""

new_content, count = pattern.subn(replacement, content, count=1)
if count > 0:
    with open('src/components/Layout.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced with regex!")
else:
    print("Regex not found!")

