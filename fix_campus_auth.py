import sys

with open('src/pages/Campus.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { currentUser } = useAuth();", "const { user } = useAuth();")

with open('src/pages/Campus.tsx', 'w') as f:
    f.write(content)

