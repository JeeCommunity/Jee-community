import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# Add effect to fetch users
old_block = """  useEffect(() => {
    fetchGroups();
  }, [user]);"""

new_block = """  useEffect(() => {
    fetchGroups();
  }, [user]);

  // Load members when group selected
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
  }, [activeGroup, usersData]);
"""
content = content.replace(old_block, new_block)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
