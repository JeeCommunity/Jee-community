import re

file_path = "src/components/UserProfileModal.tsx"
with open(file_path, "r") as f:
    content = f.read()

# First, ensure we have the nextCollege calculation inside the component
# In the component:
# const { currentLevel, nextCollege, unlockedRank } = getCampusProgress(campusStats.totalXP, campusStats.totalCoins);
# We need to insert this right after `const streak = session?.currentStreak || 0;` or similar.

import_stmt = 'import { getCampusProgress, getCollegeLevelRequired, getCumulativeCoinsNeeded } from "../lib/campusEconomy";\nimport { Building2, Zap } from "lucide-react";\n'
# It seems `getCampusProgress` is already imported at line 4?
# Let's check imports.
