import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Replace the part
pattern = re.compile(r'const handleStop = async \(uidToStop\?: string\) => \{\s+setShowCheckIn\(false\);\s+if \(\!user\) return;\s+const ref = doc\(db, "study_sessions", user\.uid\);')

replacement = """const handleStop = async (uidToStop?: string) => {
    setShowCheckIn(false);
    const targetUid = typeof uidToStop === "string" ? uidToStop : user?.uid;
    if (!targetUid) return;
    const ref = doc(db, "study_sessions", targetUid);"""

if pattern.search(content):
    content = pattern.sub(replacement, content)
    with open('src/pages/LiveStudy.tsx', 'w') as f:
        f.write(content)
    print("Replaced with regex successfully!")
else:
    print("Could not find pattern")

