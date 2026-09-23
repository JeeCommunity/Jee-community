import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# Add auto scroll ref
ref_block = "  const chatEndRef = useRef<HTMLDivElement>(null);"
new_ref_block = """  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      shouldAutoScrollRef.current = true;
    } else {
      shouldAutoScrollRef.current = false;
    }
  };"""
content = content.replace(ref_block, new_ref_block)

# Fix effect dependencies and scroll logic
effect_block = """  // Listen to chat messages if activeGroup exists
  useEffect(() => {
    if (!activeGroup || !user || isChatDisconnected) return;
    
    const q = query(
      collection(db, 'study_groups', activeGroup.id, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubMessages = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        setMessages(msgs);
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });
    
    return () => unsubMessages();
  }, [activeGroup, user, isChatDisconnected]);"""

new_effect_block = """  // Listen to chat messages if activeGroup exists
  useEffect(() => {
    if (!activeGroup?.id || !user?.uid || isChatDisconnected) return;
    
    const q = query(
      collection(db, 'study_groups', activeGroup.id, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubMessages = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        setMessages(msgs);
        
        const hasMyNewMessage = snap.docChanges().some(change => change.type === 'added' && change.doc.data().userId === user.uid);
        
        if (shouldAutoScrollRef.current || hasMyNewMessage) {
            setTimeout(() => {
              chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              shouldAutoScrollRef.current = true;
            }, 100);
        }
    });
    
    return () => unsubMessages();
  }, [activeGroup?.id, user?.uid, isChatDisconnected]);"""
content = content.replace(effect_block, new_effect_block)

# Attach onScroll to container
scroll_block = """                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 overscroll-contain relative">"""
new_scroll_block = """                    {/* Messages Area */}
                    <div ref={chatScrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 overscroll-contain relative">"""
content = content.replace(scroll_block, new_scroll_block)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
