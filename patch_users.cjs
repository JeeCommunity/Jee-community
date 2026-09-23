const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveStudy.tsx', 'utf8');

// Add usersData state
const stateMarker = 'const [goals, setGoals] = useState<Goal[]>([]);';
code = code.replace(stateMarker, stateMarker + '\n  const [usersData, setUsersData] = useState<Record<string, any>>({});\n  useEffect(() => {\n    const unsub = onSnapshot(collection(db, "users"), (snap) => {\n      const data: Record<string, any> = {};\n      snap.forEach((doc) => {\n        data[doc.id] = doc.data();\n      });\n      setUsersData(data);\n    });\n    return () => unsub();\n  }, []);');

// Inject into rendering
const renderMarker = 'sessions.sort((a, b) => {';
code = code.replace(renderMarker, 'sessions.map(s => ({ ...s, ...(usersData[s.id] || { userName: "Unknown User", userClass: "N/A", userState: "N/A" }) })).sort((a, b) => {');

fs.writeFileSync('src/pages/LiveStudy.tsx', code);
