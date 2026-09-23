import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Add usersData to interface
content = content.replace(
    "interface PrivateStudyGroupsProps {\n  sessions: any[];",
    "interface PrivateStudyGroupsProps {\n  sessions: any[];\n  usersData: Record<string, any>;"
)

content = content.replace(
    "export default function PrivateStudyGroups({ sessions, getSessionTime, formatTime, handleUserClick }: PrivateStudyGroupsProps) {",
    "export default function PrivateStudyGroups({ sessions, usersData, getSessionTime, formatTime, handleUserClick }: PrivateStudyGroupsProps) {"
)

# Replace groupMembers logic
old_logic = "const groupMembers = sessions.filter(s => activeGroup.members.includes(s.id));"
new_logic = """const groupMembers = activeGroup.members.map((memberId: string) => {
      const session = sessions.find((s: any) => s.id === memberId) || { id: memberId, isStudying: false, goals: [] };
      const uData = usersData[memberId] || {};
      return {
        ...session,
        fullName: uData.fullName || session.fullName || "Unknown User",
        userName: uData.username || session.userName || "Unknown",
        photoURL: uData.photoURL || session.photoURL || null,
      };
    });"""

content = content.replace(old_logic, new_logic)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content2 = f.read()

content2 = content2.replace(
    "<PrivateStudyGroups sessions={sessions} getSessionTime={getSessionTime} formatTime={formatTime} handleUserClick={handleUserClick} />",
    "<PrivateStudyGroups sessions={sessions} usersData={usersData} getSessionTime={getSessionTime} formatTime={formatTime} handleUserClick={handleUserClick} />"
)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content2)

