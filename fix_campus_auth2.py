import sys

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

content = content.replace("currentUser", "user")

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(content)

