import sys

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'onSnapshot(doc(db, "users", user.uid, "study_sessions", "current")',
    'onSnapshot(doc(db, "study_sessions", user.uid)'
)

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(content)

