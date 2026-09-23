with open('src/components/UserProfileModal.tsx', 'r') as f:
    content = f.read()

old_use = """          newSession.isStudying = false;
          newSession.accumulatedTime = (newSession.accumulatedTime || 0) + (3 * 3600);"""

new_use = """          newSession.isStudying = false;
          newSession.accumulatedTime = Math.min(18 * 3600, (newSession.accumulatedTime || 0) + (3 * 3600));"""

if old_use in content:
    content = content.replace(old_use, new_use)
    with open('src/components/UserProfileModal.tsx', 'w') as f:
        f.write(content)
    print("Patched UserProfileModal.tsx")
else:
    print("Not found in UserProfileModal.tsx")
