import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Fix fetchMembers effect
old_fetch = """  // Load members when group selected
  useEffect(() => {
    if (!activeGroup) return;
    
    const fetchMembers = async () => {
       const newUsers = { ...fetchedUsers };
       let updated = false;
       for (const mId of activeGroup.members || []) {
           if (!newUsers[mId] && !usersData[mId]) {
               try {
                   const d = await getDoc(doc(db, 'users', mId));
                   if (d.exists()) {
                       newUsers[mId] = d.data();
                       updated = true;
                   }
               } catch(e) {}
           }
       }
       if (updated) setFetchedUsers(newUsers);
    };
    fetchMembers();
  }, [activeGroup, usersData]);"""

new_fetch = """  // Load members when group selected
  useEffect(() => {
    if (!activeGroup) return;
    
    const fetchMembers = async () => {
       for (const mId of activeGroup.members || []) {
           setFetchedUsers(prev => {
               if (prev[mId] || usersData[mId]) return prev;
               // Fire and forget fetch
               getDoc(doc(db, 'users', mId)).then(d => {
                   if (d.exists()) {
                       setFetchedUsers(p => ({...p, [mId]: d.data()}));
                   }
               }).catch(e => {});
               return prev; // We don't update state here, the async callback does
           });
       }
    };
    fetchMembers();
  }, [activeGroup, usersData]);"""
content = content.replace(old_fetch, new_fetch)

# 2. Fix auto scroll behavior
old_scroll = """        if (shouldAutoScrollRef.current || hasMyNewMessage) {
            setTimeout(() => {
              chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              shouldAutoScrollRef.current = true;
            }, 100);
        }"""

new_scroll = """        if (shouldAutoScrollRef.current || hasMyNewMessage) {
            setTimeout(() => {
              if (chatScrollContainerRef.current) {
                 chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
              }
              shouldAutoScrollRef.current = true;
            }, 100);
        }"""
content = content.replace(old_scroll, new_scroll)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
