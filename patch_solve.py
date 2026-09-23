with open('server.ts', 'r') as f:
    content = f.read()

old_code = """      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: parts
      });"""

new_code = """      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: parts }]
      });"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Patched server.ts")
else:
    print("Code not found in server.ts")
