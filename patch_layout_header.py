import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

old_desktop_link = """              <Link 
                to="/study-room"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center relative shrink-0"
                title="Live Study Room"
              >
                <MonitorPlay className="w-5 h-5" />
                {activeStudentsCount > 0 && <span className="absolute top-1 -right-4 px-1 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full flex items-center border border-red-200 shadow-sm leading-none"><span className="w-1 h-1 bg-red-500 rounded-full mr-0.5 animate-pulse"></span>{activeStudentsCount}</span>}
              </Link>"""

new_desktop_link = """              <Link 
                to="/study-room"
                className="px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center gap-2 relative shrink-0 font-medium"
                title="Live Study Room"
              >
                <MonitorPlay className="w-5 h-5" />
                <span className="hidden lg:inline">Live Room</span>
                {activeStudentsCount > 0 && (
                  <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-full flex items-center border border-green-200 shadow-sm leading-none whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                    {activeStudentsCount} Online
                  </span>
                )}
              </Link>"""

old_mobile_link = """            <Link to="/study-room" className="relative p-1.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50">
              <MonitorPlay className="w-5 h-5" />
              {activeStudentsCount > 0 && <span className="absolute top-1 -right-2 px-1 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full flex items-center border border-red-200 shadow-sm leading-none"><span className="w-1 h-1 bg-red-500 rounded-full mr-0.5 animate-pulse"></span>{activeStudentsCount}</span>}
            </Link>"""

new_mobile_link = """            <Link to="/study-room" className="relative p-1.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 flex items-center gap-1.5">
              <MonitorPlay className="w-5 h-5" />
              {activeStudentsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full flex items-center border border-green-200 shadow-sm leading-none whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  {activeStudentsCount}
                </span>
              )}
            </Link>"""

content = content.replace(old_desktop_link, new_desktop_link)
content = content.replace(old_mobile_link, new_mobile_link)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
print("Patched layout header")
