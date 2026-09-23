import re

with open('src/AuthContext.tsx', 'r') as f:
    text = f.read()

text = text.replace("import { doc, getDoc } from 'firebase/firestore';", "import { doc, getDoc, getDocFromCache } from 'firebase/firestore';")

catch_block = """      } catch (error) {
        console.error("Error fetching profile:", error?.message || 'Error');
        // Fallback to cache if offline
        try {
            if (db) {
               const cachedSnap = await getDocFromCache(docRef);
               if (cachedSnap.exists()) {
                   setProfile({ uid: currentUser.uid, ...cachedSnap.data() as UserProfile });
                   return;
               }
            }
        } catch (cacheError) {
            console.error("Cache miss:", cacheError?.message || 'Error');
        }
        setProfile(null);
      }"""

text = re.sub(r'      \} catch \(error\) \{[^}]+\}[^}]+\}', catch_block, text)

with open('src/AuthContext.tsx', 'w') as f:
    f.write(text)
