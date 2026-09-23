import re

file_path = "src/pages/LiveStudy.tsx"
with open(file_path, "r") as f:
    c = f.read()

# Let's just move `const [now, setNow] = useState(Date.now());` to right after `const [campusStats, setCampusStats] = ...`
c = c.replace('  const [now, setNow] = useState(Date.now());', '')
c = c.replace('  const [campusStats, setCampusStats] = useState({ totalCoins: 0, totalXP: 0 });', '  const [campusStats, setCampusStats] = useState({ totalCoins: 0, totalXP: 0 });\n  const [now, setNow] = useState(Date.now());')

with open(file_path, "w") as f:
    f.write(c)
