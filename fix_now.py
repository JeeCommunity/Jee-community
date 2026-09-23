import re

file_path = "src/pages/LiveStudy.tsx"
with open(file_path, "r") as f:
    c = f.read()

c = c.replace('  const { nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(campusStats.totalXP, liveCoins), [campusStats.totalXP, liveCoins]);\n\n  const [now, setNow] = useState(Date.now());', '  const [now, setNow] = useState(Date.now());\n\n  const { nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(campusStats.totalXP, liveCoins), [campusStats.totalXP, liveCoins]);')

# Wait, the string was:
#  const { nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(campusStats.totalXP, liveCoins), [campusStats.totalXP, liveCoins]);
#  const [now, setNow] = useState(Date.now());

with open(file_path, "w") as f:
    f.write(c)
