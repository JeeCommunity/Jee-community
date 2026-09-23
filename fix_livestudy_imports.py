import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Add getCollegeLevelRequired
content = content.replace(
    'import { getCampusProgress, getDailyCoins } from "../lib/campusEconomy";',
    'import { getCampusProgress, getDailyCoins, getCollegeLevelRequired } from "../lib/campusEconomy";'
)

# Extract currentLevel
content = content.replace(
    'const { nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(campusStats.totalXP, liveCoins), [campusStats.totalXP, liveCoins]);',
    'const { currentLevel, nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(campusStats.totalXP, liveCoins), [campusStats.totalXP, liveCoins]);'
)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

