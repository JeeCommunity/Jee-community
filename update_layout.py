import sys
import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
if "from 'react'" in content:
    content = content.replace("from 'react';", "useMemo } from 'react';")
else:
    print("Could not find react import")

content = content.replace(
    "import { collection, query, where, onSnapshot } from 'firebase/firestore';",
    "import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';"
)

content = content.replace(
    "import {  LogOut, Search, User as UserIcon, ArrowLeft, UserCircle, ShieldAlert, Home , Headphones , Sun, Moon} from 'lucide-react';",
    "import {  LogOut, Search, User as UserIcon, ArrowLeft, UserCircle, ShieldAlert, Home , Headphones , Sun, Moon, Star, Zap} from 'lucide-react';"
)

content = content.replace(
    "import { getFirstName } from '../lib/utils';",
    "import { getFirstName, getLocalDate } from '../lib/utils';\nimport { getCampusProgress, getDailyCoins, getDailyXP } from '../lib/campusEconomy';"
)

# 2. Add state and logic
state_and_logic = """  const [mySession, setMySession] = useState<any>(null);
  const [campusStats, setCampusStats] = useState({ totalXP: 0, totalCoins: 0 });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubSession = onSnapshot(doc(db, "study_sessions", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setMySession(docSnap.data());
      } else {
        setMySession(null);
      }
    });

    const unsubStats = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.campus) {
          setCampusStats({
            totalXP: data.campus.totalXP || 0,
            totalCoins: data.campus.totalCoins || 0
          });
        }
      }
    });

    return () => { unsubSession(); unsubStats(); };
  }, [user]);

  const getSessionTime = (session: any) => {
    if (!session || session.status !== "active") return 0;
    return Math.floor((now - session.startTime) / 60000) + (session.accumulatedTime || 0);
  };

  const liveCoins = useMemo(() => {
    if (!mySession) return campusStats.totalCoins;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
      oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveCoins = getDailyCoins(currentDailyTime / 60) - getDailyCoins(oldDailyTime / 60);
    return campusStats.totalCoins + max(0, addedLiveCoins);
  }, [mySession, campusStats.totalCoins, now]);

  const liveXP = useMemo(() => {
    if (!mySession) return campusStats.totalXP;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
      oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveXP = getDailyXP(currentDailyTime / 60) - getDailyXP(oldDailyTime / 60);
    return campusStats.totalXP + max(0, addedLiveXP);
  }, [mySession, campusStats.totalXP, now]);

  const { currentLevel } = getCampusProgress(liveXP, liveCoins);

  function max(a: number, b: number) { return Math.max(a, b); }
"""

content = content.replace("  const dropdownRef = useRef<HTMLDivElement>(null);\n", "  const dropdownRef = useRef<HTMLDivElement>(null);\n\n" + state_and_logic)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)

