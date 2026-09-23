import re

file_path = "src/pages/LiveStudy.tsx"
with open(file_path, "r") as f:
    c = f.read()

# Add useEffect for campusStats
import_str = """import { getCampusProgress, getDailyCoins } from "../lib/campusEconomy";\n"""
if "getCampusProgress" not in c:
    c = c.replace('import { updateSessionWithEconomy }', import_str + 'import { updateSessionWithEconomy }')

effect_str = """  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.campus) {
          setCampusStats({
            totalCoins: data.campus.totalCoins || 0,
            totalXP: data.campus.totalXP || 0
          });
        }
      }
    });
    return () => unsub();
  }, [user]);

  const liveCoins = React.useMemo(() => {
    if (!mySession) return campusStats.totalCoins;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
       oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveCoins = getDailyCoins(currentDailyTime / 60) - getDailyCoins(oldDailyTime / 60);
    return campusStats.totalCoins + Math.max(0, addedLiveCoins);
  }, [mySession, campusStats.totalCoins, now]);

  const { nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(campusStats.totalXP, liveCoins), [campusStats.totalXP, liveCoins]);
"""

if "const liveCoins =" not in c:
    c = c.replace('  const [now, setNow] = useState(Date.now());', effect_str + '\n  const [now, setNow] = useState(Date.now());')

# Insert Tracker Component
tracker_str = """            {nextCollege && requiredCoinsForNext && (
              <div className="w-full bg-slate-900/40 rounded-xl p-3 border border-slate-700/50 mb-3 shadow-inner">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-300">Next: {nextCollege.name}</span>
                  <span className="text-yellow-400">{(requiredCoinsForNext - liveCoins).toLocaleString()} Coins Left</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                    style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }}
                  />
                </div>
              </div>
            )}"""

c = c.replace(
"""            <div className="text-blue-200/70 font-bold tracking-widest uppercase text-[9px] mb-4">
              MY STUDY TIME • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>""",
f"""            <div className="text-blue-200/70 font-bold tracking-widest uppercase text-[9px] mb-3">
              MY STUDY TIME • {{new Date().toLocaleDateString('en-US', {{ month: 'short', day: 'numeric', year: 'numeric' }})}}
            </div>
{tracker_str}""")

with open(file_path, "w") as f:
    f.write(c)

