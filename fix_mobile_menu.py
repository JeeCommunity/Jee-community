import sys

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

target = """                <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <MessageSquareQuote className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Community</span>
                </Link>"""

replacement = """                <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <MessageSquareQuote className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Community</span>
                </Link>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={toggleTheme} className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                    <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </div>"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced successfully!")
else:
    print("Not found target!")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

