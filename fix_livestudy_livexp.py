import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import { getCampusProgress, getDailyCoins, getCollegeLevelRequired } from "../lib/campusEconomy";',
    'import { getCampusProgress, getDailyCoins, getDailyXP, getCollegeLevelRequired } from "../lib/campusEconomy";'
)

live_xp_code = """
  const liveXP = React.useMemo(() => {
    if (!mySession) return campusStats.totalXP;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
       oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveXP = getDailyXP(currentDailyTime / 60) - getDailyXP(oldDailyTime / 60);
    return campusStats.totalXP + Math.max(0, addedLiveXP);
  }, [mySession, campusStats.totalXP, now]);

  const { currentLevel, nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(liveXP, liveCoins), [liveXP, liveCoins]);
"""

content = content.replace(
    '  const { currentLevel, nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(campusStats.totalXP, liveCoins), [campusStats.totalXP, liveCoins]);',
    live_xp_code
)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

