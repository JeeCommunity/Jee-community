import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target1 = """  const handleUserClick = (userId: string) => {
    const session = sessions.find((s) => s.id === userId);"""
replacement1 = """  const displaySessions = [...sessions];
  if (user && mySession && !displaySessions.find(s => s.id === user.uid)) {
    displaySessions.push(mySession);
  }

  const handleUserClick = (userId: string) => {
    const session = displaySessions.find((s) => s.id === userId);"""

if target1 in content:
    content = content.replace(target1, replacement1)

target2 = """            {sessions.map(s => ({ fullName: "Unknown User", role: "student", ...s, ...(usersData[s.id] || {}) })).sort((a, b) => {"""
replacement2 = """            {displaySessions.map(s => ({ fullName: "Unknown User", role: "student", ...s, ...(usersData[s.id] || {}) })).sort((a, b) => {"""

if target2 in content:
    content = content.replace(target2, replacement2)

target3 = """                <div key={s.id} onClick={() => !isMe && handleUserClick(s.id)} className="""
replacement3 = """                <div key={s.id} onClick={() => handleUserClick(s.id)} className="""

if target3 in content:
    content = content.replace(target3, replacement3)
    
with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)
