import sys

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Update back button
content = content.replace(
    'className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800" title="Go back"',
    'className={`p-1 -ml-1 transition-colors rounded-full ${isCampus ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800"}`} title="Go back"'
)

# Update menu button
content = content.replace(
    '<button className="p-1" onClick={() => setIsMobileMenuOpen(true)}>',
    '<button className={`p-1 ${isCampus ? "text-slate-300" : ""}`} onClick={() => setIsMobileMenuOpen(true)}>'
)

# Update Title
content = content.replace(
    '<h1 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{currentCommunity} Community</h1>',
    '<h1 className={`text-[15px] font-bold leading-tight ${isCampus ? "text-white" : "text-slate-900 dark:text-white"}`}>{currentCommunity} Community</h1>'
)

# Update Subtitle
content = content.replace(
    '<span className="text-[11px] text-slate-500 dark:text-slate-400">Doubt & Study Groups</span>',
    '<span className={`text-[11px] ${isCampus ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>Doubt & Study Groups</span>'
)

# Update Desktop Nav Title
content = content.replace(
    '<span className="font-black text-xl tracking-tight text-slate-800 dark:text-slate-200">',
    '<span className={`font-black text-xl tracking-tight ${isCampus ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>'
)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
