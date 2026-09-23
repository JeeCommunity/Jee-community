import re

file_path = "src/components/Layout.tsx"
with open(file_path, "r") as f:
    c = f.read()

# Desktop Nav
c = c.replace(
"""              <Link 
                to="/study-room"
                className={`p-3 rounded-2xl flex items-center justify-center transition-all relative ${
                  location.pathname === '/study-room' 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Live Study Room"
              >
                <MonitorPlay className="w-5 h-5" />""",
"""              <Link 
                to="/study-room"
                className={`p-3 rounded-2xl flex items-center justify-center transition-all relative ${
                  location.pathname === '/study-room' 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Live Study Room"
              >
                <MonitorPlay className="w-5 h-5" />
              </Link>
              
              <Link 
                to="/campus"
                className={`p-3 rounded-2xl flex items-center justify-center transition-all relative ${
                  location.pathname === '/campus' 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="My Campus"
              >
                <Building2 className="w-5 h-5" />""")


# Mobile Nav
c = c.replace(
"""                <Link to="/study-room" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">""",
"""                <Link to="/campus" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <Building2 className="w-5 h-5" />
                  <span>My Campus</span>
                </Link>
                <Link to="/study-room" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">""")

with open(file_path, "w") as f:
    f.write(c)

