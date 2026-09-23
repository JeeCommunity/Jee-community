import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Auto-stop after 3 hours and handle midnight reset
target_timer = """  useEffect(() => {
    let checkInTimer: any = null;
    if (mySession?.isStudying) {
      if (!lastCheckInTimeRef.current) {
        lastCheckInTimeRef.current = Date.now();
      }
      checkInTimer = setInterval(() => {
        if (!showCheckIn) {
          const now = Date.now();
          // Check if 2 hours have passed
          if (now - lastCheckInTimeRef.current >= 2 * 60 * 60 * 1000) {
            setShowCheckIn(true);
            setCheckInCountdown(60);
          }
        }
      }, 10000); // Check every 10 seconds
    } else {
      setShowCheckIn(false);
    }
    return () => {
      if (checkInTimer) clearInterval(checkInTimer);
    };
  }, [mySession?.isStudying, showCheckIn]);"""

replacement_timer = """  useEffect(() => {
    let checkInTimer: any = null;
    if (mySession?.isStudying) {
      if (!lastCheckInTimeRef.current) {
        lastCheckInTimeRef.current = Date.now();
      }
      checkInTimer = setInterval(() => {
        const now = Date.now();
        
        // Check midnight reset
        const currentLocalDay = new Date().toDateString();
        if (mySession.dailyDate && new Date(now).toDateString() !== new Date(mySession.startTime || now).toDateString()) {
           handleStop();
           return;
        }

        // Auto-stop if slot reaches 3 hours (10800 seconds)
        const timeStudiedInSlot = Math.floor((now - (mySession.startTime || now)) / 1000);
        if (timeStudiedInSlot >= 3 * 3600) {
           handleStop();
           return;
        }

        if (!showCheckIn) {
          // Check if 2 hours have passed without check-in
          if (now - lastCheckInTimeRef.current >= 2 * 60 * 60 * 1000) {
            setShowCheckIn(true);
            setCheckInCountdown(60);
          }
        }
      }, 5000); // Check every 5 seconds
    } else {
      setShowCheckIn(false);
    }
    return () => {
      if (checkInTimer) clearInterval(checkInTimer);
    };
  }, [mySession?.isStudying, showCheckIn, mySession?.startTime, mySession?.dailyDate]);"""

if target_timer in content:
    content = content.replace(target_timer, replacement_timer)
    print("Replaced timer logic!")
else:
    print("Could not find timer logic!")

target_start = """  const handleStart = async (goalId?: string) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();"""

replacement_start = """  const handleStart = async (goalId?: string) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();
    
    if (snap.exists()) {
      const { baseTime } = resolveSessionState(snap.data(), todayDate);
      if (baseTime >= 18 * 3600) {
        alert("You have reached the maximum study limit of 18 hours for today!");
        return;
      }
    }"""

if target_start in content:
    content = content.replace(target_start, replacement_start)
    print("Replaced start logic!")
else:
    print("Could not find start logic!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

