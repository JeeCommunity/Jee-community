import re

with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

pattern = re.compile(r"  useEffect\(\(\) => \{.*?(?=  return \()", re.DOTALL)
match = pattern.search(content)

if match:
    # Just an empty useEffect or small one if needed.
    new_use_effect = """  useEffect(() => {
    // Video handles audio and animation for NIT Arunachal Pradesh
    return () => {};
  }, [college]);\n\n"""
    content = content[:match.start()] + new_use_effect + content[match.end():]
    with open("src/pages/Campus.tsx", "w") as f:
        f.write(content)
    print("Patched audio")
else:
    print("Not found")
