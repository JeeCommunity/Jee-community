import re

with open("src/pages/AdminDashboard.tsx", "r") as f:
    content = f.read()

# 1. Fix fetch users order
old_fetch_users = "const usersQuery = query(usersColl, limit(20));"
new_fetch_users = "const usersQuery = query(usersColl, orderBy('createdAt', 'desc'), limit(20));"

if old_fetch_users in content:
    content = content.replace(old_fetch_users, new_fetch_users)
    print("Patched fetch users order")

# 2. handleLoadMoreUsers order
old_load_more = "const q = query(collection(db, 'users'), startAfter(usersLastDoc), limit(20));"
new_load_more = "const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(usersLastDoc), limit(20));"

if old_load_more in content:
    content = content.replace(old_load_more, new_load_more)
    print("Patched handleLoadMoreUsers order")

with open("src/pages/AdminDashboard.tsx", "w") as f:
    f.write(content)
