import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Add useTheme import
content = content.replace("import { getFirstName } from '../lib/utils';", "import { getFirstName } from '../lib/utils';\nimport { useTheme } from '../ThemeContext';")

# Add Sun, Moon to lucide imports
content = re.sub(r"import \{([^}]+)\} from 'lucide-react';", lambda m: f"import {{{m.group(1)}, Sun, Moon}} from 'lucide-react';", content, 1)

# Add useTheme hook inside Layout component
content = re.sub(r"(export default function Layout\(\) \{)", r"\1\n  const { theme, toggleTheme } = useTheme();", content, 1)

toggle_btn = """
            <button onClick={toggleTheme} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationsDropdown />
"""

mobile_toggle_btn = """
              <div className="flex items-center justify-center shrink-0">
                <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center relative shrink-0">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-center shrink-0">
                <NotificationsDropdown />
              </div>
"""

# Desktop toggle
content = content.replace("<NotificationsDropdown />", toggle_btn, 1)

# Mobile toggle
content = content.replace("""<div className="flex items-center justify-center shrink-0">
                <NotificationsDropdown />
              </div>""", mobile_toggle_btn)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

print("Theme toggle added.")
