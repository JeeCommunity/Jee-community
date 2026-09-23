import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

target = r'<Outlet />\s*</main>'
replacement = '''<Outlet />
        {user && (
          <footer className="mt-auto pt-8 pb-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-center space-x-6 mb-2">
              <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
              <Link to="/disclaimer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Disclaimer</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} JEE Community. All rights reserved.</p>
          </footer>
        )}
      </main>'''

content = re.sub(target, replacement, content)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
