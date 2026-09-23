import sys

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const isCampus = location.pathname === '/campus';\n", "")

# insert after location = useLocation();
parts = content.split("  const location = useLocation();\n")
if len(parts) == 2:
    content = parts[0] + "  const location = useLocation();\n  const isCampus = location.pathname === '/campus';\n" + parts[1]

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

