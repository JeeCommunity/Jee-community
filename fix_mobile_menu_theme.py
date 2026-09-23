import sys

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

target = """                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>"""

replacement = """                <button onClick={() => { setIsMobileMenuOpen(false); toggleTheme(); }} className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg font-medium transition-colors text-left">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced successfully!")
else:
    print("Not found target!")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

