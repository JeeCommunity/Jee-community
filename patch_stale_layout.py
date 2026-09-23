with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

old_fetch = """        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.isStudying) {
            const c = data.communityType || "JEE";
            if (c === currentCommunity || c === "Both") {
              count++;
            }
          }
        });"""

new_fetch = """        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.isStudying) {
            let isReallyActive = true;
            if (data.startTime) {
              const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
              if (elapsedSeconds >= 3 * 3600) {
                isReallyActive = false;
              }
            }
            if (isReallyActive) {
              const c = data.communityType || "JEE";
              if (c === currentCommunity || c === "Both") {
                count++;
              }
            }
          }
        });"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    with open('src/components/Layout.tsx', 'w') as f:
        f.write(content)
    print("Patched Layout.tsx")
else:
    print("Not found in Layout.tsx")
