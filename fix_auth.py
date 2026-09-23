import re
with open('src/AuthContext.tsx', 'r') as f:
    text = f.read()

# Replace the specific syntax error
pattern = r'\} catch \(cacheError\) \{\s*console\.error\(\"Cache miss:\", cacheError\?\.message \|\| \'Error\'\);\s*\}\s*setProfile\(null\);\s*\} else \{\s*setProfile\(null\);\s*\}'
replacement = r"""} catch (cacheError) {
            console.error("Cache miss:", cacheError?.message || 'Error');
        }
        setProfile(null);
      }
    } else {
      setProfile(null);
    }"""
text = re.sub(pattern, replacement, text)

with open('src/AuthContext.tsx', 'w') as f:
    f.write(text)
