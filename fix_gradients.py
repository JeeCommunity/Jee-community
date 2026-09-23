import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

replacements = {
    r"from-slate-50 to-blue-50/30": "from-slate-50 to-blue-50/30 dark:from-slate-800/80 dark:to-slate-900/50",
    r"bg-red-50 text-red-600 hover:bg-red-100": "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40",
    r"text-slate-400 uppercase tracking-wider": "text-slate-400 dark:text-slate-500 uppercase tracking-wider",
    r"text-blue-600": "text-blue-600 dark:text-blue-400",
}

for pattern, repl in replacements.items():
    content = re.sub(pattern, repl, content)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

print("Fixed gradients.")
