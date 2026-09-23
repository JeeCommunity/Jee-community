import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """  useEffect(() => {
    if (mySession && mySession.goals) {
      const todayStr = new Date().toDateString();
      const todaysGoals = mySession.goals.filter((g: Goal) => {
        if (!g.createdAt) return false;
        return new Date(g.createdAt).toDateString() === todayStr;
      });
      setGoals(todaysGoals);
    }
  }, [mySession]);"""

replacement = """  const [todayStr, setTodayStr] = useState(new Date().toDateString());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTodayStr(new Date().toDateString());
    }, 60000); // Check every minute for day change
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mySession && mySession.goals) {
      const todaysGoals = mySession.goals.filter((g: Goal) => {
        if (!g.createdAt) return false;
        return new Date(g.createdAt).toDateString() === todayStr;
      });
      setGoals(todaysGoals);
    }
  }, [mySession, todayStr]);"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced goals reset logic!")
else:
    print("Could not find goals reset logic!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

