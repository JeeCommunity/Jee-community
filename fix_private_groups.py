import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Replace onSnapshot import
content = content.replace("import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, orderBy, addDoc, limit, deleteDoc } from 'firebase/firestore';", "import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, orderBy, addDoc, limit, deleteDoc } from 'firebase/firestore';")

# Fix typing listener
pattern_typing = re.compile(r'    const unsub = onSnapshot\(q, \(snap\) => \{\n      const now = Date.now\(\);\n      const typing = snap\.docs\n        \.map\(doc => \(\{ uid: doc\.id, \.\.\.doc\.data\(\) \} as any\)\)\n        \.filter\(t => t\.uid !== user\.uid && now - t\.timestamp < 4000\)\n        \.map\(t => \(\{ name: t\.name, uid: t\.uid, timestamp: t\.timestamp \}\)\);\n      setTypingUsers\(typing\);\n    \}\);\n    \n    return \(\) => \{\n       unsub\(\);\n       clearInterval\(interval\);\n       if \(typingTimeoutRef\.current\) clearTimeout\(typingTimeoutRef\.current\);\n       deleteDoc\(doc\(db, \'study_groups\', activeGroup\.id, \'typing\', user\.uid\)\)\.catch\(\(\) => \{\}\);\n    \};', re.DOTALL)
repl_typing = """    const fetchTyping = async () => {
      try {
        const snap = await getDocs(q);
        const now = Date.now();
        const typing = snap.docs
          .map(doc => ({ uid: doc.id, ...doc.data() } as any))
          .filter(t => t.uid !== user.uid && now - t.timestamp < 4000)
          .map(t => ({ name: t.name, uid: t.uid, timestamp: t.timestamp }));
        setTypingUsers(typing);
      } catch (err) {}
    };

    fetchTyping();
    const pollInterval = setInterval(fetchTyping, 3000);
    
    return () => {
       clearInterval(pollInterval);
       clearInterval(interval);
       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
       deleteDoc(doc(db, 'study_groups', activeGroup.id, 'typing', user.uid)).catch(() => {});
    };"""
content = pattern_typing.sub(repl_typing, content)

# Fix messages listener
pattern_msgs = re.compile(r'    const unsub = onSnapshot\(q, \(snap\) => \{\n      const msgs = snap\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\)\.reverse\(\);\n      setMessages\(msgs\);\n      setTimeout\(\(\) => \{\n        chatEndRef\.current\?\.scrollIntoView\(\{ behavior: \'smooth\' \}\);\n      \}, 100\);\n    \}\);\n    \n    return \(\) => unsub\(\);', re.DOTALL)
repl_msgs = """    const fetchMessages = async () => {
      try {
        const snap = await getDocs(q);
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        setMessages(msgs);
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (err) {}
    };

    fetchMessages();
    const msgsInterval = setInterval(fetchMessages, 3000); // Poll every 3s
    
    return () => clearInterval(msgsInterval);"""
content = pattern_msgs.sub(repl_msgs, content)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
