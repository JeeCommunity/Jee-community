import re
with open('src/AuthContext.tsx', 'r') as f:
    text = f.read()

text = text.replace("requestNotificationPermission(currentUser.uid).catch", "// requestNotificationPermission(currentUser.uid).catch")

with open('src/AuthContext.tsx', 'w') as f:
    f.write(text)
