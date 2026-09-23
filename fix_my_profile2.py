import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """onClick={() => (!isMe || profile?.role === 'admin') && handleUserClick(s.id)}"""
replacement = """onClick={() => handleUserClick(s.id)}"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("Could not find target block")
    
with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
