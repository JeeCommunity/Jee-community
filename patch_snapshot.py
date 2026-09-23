import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Patch typing snapshot
old_typing_snap = """    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const typing = snap.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as any))
        .filter(t => t.uid !== user.uid && now - t.timestamp < 4000)
        .map(t => ({ name: t.name, uid: t.uid, timestamp: t.timestamp }));
      setTypingUsers(typing);
    });"""

new_typing_snap = """    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const typing = snap.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as any))
        .filter(t => t.uid !== user.uid && now - t.timestamp < 4000)
        .map(t => ({ name: t.name, uid: t.uid, timestamp: t.timestamp }));
      setTypingUsers(typing);
    }, (error) => {
      console.warn("Typing indicator not available:", error);
    });"""

content = content.replace(old_typing_snap, new_typing_snap)

# Patch messages snapshot
old_msg_snap = """    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });"""

new_msg_snap = """    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error("Error loading messages:", error);
    });"""

content = content.replace(old_msg_snap, new_msg_snap)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

