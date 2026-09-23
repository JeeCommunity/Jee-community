import re

with open('src/pages/Legal.tsx', 'r') as f:
    content = f.read()

# Replace PageWrapper prose div
content = content.replace(
    '<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400">',
    '<div className="text-slate-700 dark:text-slate-300 space-y-6">'
)

# Style h3
content = re.sub(r'<h3>(.*?)</h3>', r'<h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">\1</h3>', content)

# Style p
content = re.sub(r'<p>(.*?)</p>', r'<p className="leading-relaxed">\1</p>', content, flags=re.DOTALL)

# Style ul
content = re.sub(r'<ul>(.*?)</ul>', r'<ul className="list-disc pl-6 space-y-2 mt-4">\1</ul>', content, flags=re.DOTALL)

# Style li
# Actually standard ul/li styling is fine with the above classes

with open('src/pages/Legal.tsx', 'w') as f:
    f.write(content)
