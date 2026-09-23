const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');
code = code.replace(
  "const [hasActiveStudents, setHasActiveStudents] = useState(false);",
  "const [activeStudentsCount, setActiveStudentsCount] = useState(0);"
);
code = code.replace(
  "setHasActiveStudents(activeCount > 0);",
  "setActiveStudentsCount(activeCount);"
);
// Now fix the UI part in Layout.tsx:
// Desktop
code = code.replace(
  "{hasActiveStudents && <span className=\"absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]\"></span>}",
  "{activeStudentsCount > 0 && <span className=\"ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full flex items-center border border-red-200\"><span className=\"w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse\"></span>Live {activeStudentsCount}</span>}"
);
// Mobile
code = code.replace(
  "{hasActiveStudents && <span className=\"w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]\"></span>}",
  "{activeStudentsCount > 0 && <span className=\"ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full flex items-center border border-red-200\"><span className=\"w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse\"></span>Live {activeStudentsCount}</span>}"
);

fs.writeFileSync('src/components/Layout.tsx', code);
