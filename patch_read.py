import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

effect = """
  // Mark messages as read when tab is open
  useEffect(() => {
    if (activeGroupTab === 'chat' && activeGroup && user && messages.length > 0) {
      messages.forEach(msg => {
        if (msg.userId !== user.uid && (!msg.readBy || !msg.readBy.includes(user.uid))) {
          const msgRef = doc(db, 'study_groups', activeGroup.id, 'messages', msg.id);
          updateDoc(msgRef, {
            readBy: arrayUnion(user.uid)
          }).catch(console.error);
        }
      });
    }
  }, [activeGroupTab, messages, activeGroup, user]);
"""

# Insert effect before handleCreateGroup
content = content.replace("  const handleCreateGroup =", effect + "\n  const handleCreateGroup =")

# Update handleSendMessage
send_msg_replacement = """      await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
        text: newMessage.trim(),
        userId: user.uid,
        userName: profile.fullName || profile.username || "Unknown",
        userPhoto: profile.photoURL || null,
        createdAt: serverTimestamp(),
        replyToId: replyingTo?.id || null,
        replyToText: replyingTo?.text || null,
        replyToUser: replyingTo?.userName || null,
        type: imagePreview ? 'image' : 'text',
        imageUrl: imagePreview || null,
        readBy: [user.uid]
      });"""

content = re.sub(r"await addDoc\(collection\(db, 'study_groups', activeGroup.id, 'messages'\), \{.*?imageUrl: imagePreview \|\| null\n\s+\}\);", send_msg_replacement, content, flags=re.DOTALL)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
