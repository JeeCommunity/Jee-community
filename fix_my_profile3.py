import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

target1 = """onClick={() => (s.id !== user?.uid || profile?.role === 'admin') && handleUserClick(s.id)}"""
replacement1 = """onClick={() => handleUserClick(s.id)}"""

target2 = """onClick={() => (!isMe || profile?.role === 'admin') && handleUserClick(s.id)}"""
replacement2 = """onClick={() => handleUserClick(s.id)}"""

if target1 in content:
    content = content.replace(target1, replacement1)
    
if target2 in content:
    content = content.replace(target2, replacement2)
    
with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
