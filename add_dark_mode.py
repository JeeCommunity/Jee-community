import os
import re

directories = ['src/components', 'src/pages']

replacements = {
    r"\bbg-white\b": "bg-white dark:bg-slate-900",
    r"\bbg-slate-50\b": "bg-slate-50 dark:bg-slate-800",
    r"\bbg-slate-100\b": "bg-slate-100 dark:bg-slate-800",
    r"\bbg-slate-200\b": "bg-slate-200 dark:bg-slate-700",
    r"\bbg-gray-50\b": "bg-gray-50 dark:bg-slate-800",
    r"\bbg-gray-100\b": "bg-gray-100 dark:bg-slate-800",
    
    r"\bborder-slate-100\b": "border-slate-100 dark:border-slate-800",
    r"\bborder-slate-200\b": "border-slate-200 dark:border-slate-700",
    r"\bborder-slate-300\b": "border-slate-300 dark:border-slate-600",
    r"\bborder-gray-100\b": "border-gray-100 dark:border-slate-800",
    r"\bborder-gray-200\b": "border-gray-200 dark:border-slate-700",
    
    r"\btext-slate-900\b": "text-slate-900 dark:text-white",
    r"\btext-slate-800\b": "text-slate-800 dark:text-slate-200",
    r"\btext-slate-700\b": "text-slate-700 dark:text-slate-300",
    r"\btext-slate-600\b": "text-slate-600 dark:text-slate-400",
    r"\btext-slate-500\b": "text-slate-500 dark:text-slate-400",
    r"\btext-gray-900\b": "text-gray-900 dark:text-white",
    r"\btext-gray-800\b": "text-gray-800 dark:text-slate-200",
    r"\btext-gray-700\b": "text-gray-700 dark:text-slate-300",
    r"\btext-gray-600\b": "text-gray-600 dark:text-slate-400",
    r"\btext-gray-500\b": "text-gray-500 dark:text-slate-400",
    
    r"\btext-black\b": "text-black dark:text-white",
    r"\bhover:bg-slate-50\b": "hover:bg-slate-50 dark:hover:bg-slate-800",
    r"\bhover:bg-slate-100\b": "hover:bg-slate-100 dark:hover:bg-slate-700",
    r"\bhover:bg-gray-50\b": "hover:bg-gray-50 dark:hover:bg-slate-800",
    r"\bhover:text-slate-900\b": "hover:text-slate-900 dark:hover:text-white",
    r"\bhover:text-slate-700\b": "hover:text-slate-700 dark:hover:text-slate-300",
    r"\bring-slate-200\b": "ring-slate-200 dark:ring-slate-700",
    r"\bring-slate-100\b": "ring-slate-100 dark:ring-slate-800",
}

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # We need to make sure we don't duplicate
                original_content = content
                for pattern, repl in replacements.items():
                    # Only replace if not already replaced
                    # The naive regex might replace `bg-white` inside `bg-white dark:bg-slate-900` 
                    # but if we do it all at once on the original file, it won't be an issue
                    # wait, re.sub replaces non-overlapping matches
                    
                    # To be safe from multiple runs, let's skip files that already have dark: 
                    # Actually we know none have it yet.
                    content = re.sub(pattern, repl, content)
                
                if content != original_content:
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Updated {filepath}")

