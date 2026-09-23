import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Fix chat input area padding
old_chat_input = r'<div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-safe">'
new_chat_input = '<div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">'
content = re.sub(old_chat_input, new_chat_input, content)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
