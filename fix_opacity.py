import os
import re

directories = ['src/components', 'src/pages']

replacements = [
    # Match something like (hover:)bg-white dark:bg-slate-900/(10)
    (r"([a-zA-Z:]*)bg-white dark:bg-slate-900/([0-9]+)", r"\1bg-white/\2 dark:\1bg-slate-900/\2"),
    (r"([a-zA-Z:]*)bg-slate-50 dark:bg-slate-800/([0-9]+)", r"\1bg-slate-50/\2 dark:\1bg-slate-800/\2"),
    (r"([a-zA-Z:]*)bg-slate-100 dark:bg-slate-800/([0-9]+)", r"\1bg-slate-100/\2 dark:\1bg-slate-800/\2"),
    (r"([a-zA-Z:]*)bg-slate-200 dark:bg-slate-700/([0-9]+)", r"\1bg-slate-200/\2 dark:\1bg-slate-700/\2"),
    (r"([a-zA-Z:]*)bg-gray-50 dark:bg-slate-800/([0-9]+)", r"\1bg-gray-50/\2 dark:\1bg-slate-800/\2"),
    (r"([a-zA-Z:]*)bg-gray-100 dark:bg-slate-800/([0-9]+)", r"\1bg-gray-100/\2 dark:\1bg-slate-800/\2"),
]

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                original_content = content
                for pattern, repl in replacements:
                    content = re.sub(pattern, repl, content)
                
                if content != original_content:
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Fixed opacities in {filepath}")

