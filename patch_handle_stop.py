import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Make handleStop take an argument
content = content.replace('const handleStop = async () => {', 'const handleStop = async (uidToStop?: string) => {')

# Find the start
start = content.find('const handleStop = async (uidToStop?: string) => {')
if start != -1:
    end = content.find('await updateDoc(ref, updatePayload);', start)
    snippet = content[start:end+100]
    
    # We want to change:
    # if (!user) return;
    # const ref = doc(db, "study_sessions", user.uid);
    # To:
    # const targetUid = uidToStop || user?.uid;
    # if (!targetUid) return;
    # const ref = doc(db, "study_sessions", targetUid);
    
    new_snippet = snippet.replace('if (!user) return;\n    const ref = doc(db, "study_sessions", user.uid);', 
                                  'const targetUid = typeof uidToStop === "string" ? uidToStop : user?.uid;\n    if (!targetUid) return;\n    const ref = doc(db, "study_sessions", targetUid);')
    
    content = content.replace(snippet, new_snippet)
    
    with open('src/pages/LiveStudy.tsx', 'w') as f:
        f.write(content)
    print("Patched handleStop")
else:
    print("Could not find handleStop")

