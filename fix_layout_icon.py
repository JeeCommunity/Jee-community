import sys

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

target = """          <div className="flex items-center space-x-1">
            <NotificationsDropdown />
            <Link to="/campus" className={`flex items-center gap-1.5 px-2 py-1 ${isCampus ? 'bg-[#0A101D]/80 border border-white/5 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'} rounded-full cursor-pointer`}>"""

replacement = """          <div className="flex items-center space-x-1">
            <NotificationsDropdown />
            <Link to="/study-room" className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
              <MonitorPlay className="w-5 h-5" />
              {activeStudentsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 text-[8px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm leading-none z-10">
                  <span className="w-1 h-1 bg-white dark:bg-slate-900 rounded-full mr-0.5 animate-pulse"></span>
                  {activeStudentsCount}
                </span>
              )}
            </Link>
            <Link to="/campus" className={`flex items-center gap-1.5 px-2 py-1 ${isCampus ? 'bg-[#0A101D]/80 border border-white/5 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'} rounded-full cursor-pointer`}>"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced successfully!")
else:
    print("Not found target!")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

