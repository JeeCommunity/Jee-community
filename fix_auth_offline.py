import re

with open('src/AuthContext.tsx', 'r') as f:
    text = f.read()

# Update success branch to save to localStorage
success_pattern = r'setProfile\(\{ uid: currentUser\.uid, \.\.\.data \}\);\n\s*\} else \{'
success_replacement = r"""setProfile({ uid: currentUser.uid, ...data });
          localStorage.setItem('userProfileCache_' + currentUser.uid, JSON.stringify({ uid: currentUser.uid, ...data }));
        } else {
          localStorage.removeItem('userProfileCache_' + currentUser.uid);"""

text = re.sub(success_pattern, success_replacement, text)

# Update error branch to read from localStorage
error_pattern = r'\} catch \(error: any\) \{\s*console\.error\(\"Error fetching profile:\", error\?\.message \|\| \'Error\'\);\s*// Fallback to cache if offline\s*try \{\s*if \(db\) \{\s*const cachedSnap = await getDocFromCache\(docRef\);\s*if \(cachedSnap\.exists\(\)\) \{\s*setProfile\(\{ uid: currentUser\.uid, \.\.\.cachedSnap\.data\(\) as UserProfile \}\);\s*return;\s*\}\s*\}\s*\} catch \(cacheError: any\) \{\s*console\.error\(\"Cache miss:\", cacheError\?\.message \|\| \'Error\'\);\s*\}\s*setProfile\(null\);\s*\}'

error_replacement = r"""} catch (error: any) {
        console.error("Error fetching profile:", error?.message || 'Error');
        // Fallback to localStorage cache if offline
        const localCache = localStorage.getItem('userProfileCache_' + currentUser.uid);
        if (localCache) {
            try {
                setProfile(JSON.parse(localCache));
                return;
            } catch (e) {
                console.error("Failed to parse cached profile", e);
            }
        }
        // If no cache, we just set profile to null (forces setup)
        setProfile(null);
      }"""

text = re.sub(error_pattern, error_replacement, text)

with open('src/AuthContext.tsx', 'w') as f:
    f.write(text)
