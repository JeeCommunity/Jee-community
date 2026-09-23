import sys

# 1. vite.config.ts
with open('vite.config.ts', 'r') as f:
    content = f.read()
content = content.replace("outDir: 'build',", "outDir: 'dist',")
with open('vite.config.ts', 'w') as f:
    f.write(content)

# 2. package.json
with open('package.json', 'r') as f:
    content = f.read()
content = content.replace("build/server.cjs", "dist/server.cjs")
content = content.replace("rm -rf build server.js", "rm -rf dist server.js")
with open('package.json', 'w') as f:
    f.write(content)

# 3. server.ts
with open('server.ts', 'r') as f:
    content = f.read()
content = content.replace("const distPath = path.join(process.cwd(), 'build');", "const distPath = path.join(process.cwd(), 'dist');")
with open('server.ts', 'w') as f:
    f.write(content)

print("Patched all files to dist dir")
