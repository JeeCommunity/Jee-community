import re
with open('src/AuthContext.tsx', 'r') as f:
    text = f.read()

pattern = r'const docRef = doc\(db, \'users\', currentUser\.uid\);'
replacement = r'const userDocRef = doc(db, \'users\', currentUser.uid);\n        const docRef = userDocRef;' # let's just move it out

text = text.replace(
    "try {\n        if (!db) {",
    "if (!db) {\n          setProfile(null);\n          return;\n        }\n        const docRef = doc(db, 'users', currentUser.uid);\n        try {"
)

with open('src/AuthContext.tsx', 'w') as f:
    f.write(text)
