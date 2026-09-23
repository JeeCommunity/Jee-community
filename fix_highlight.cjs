const fs = require('fs');

let file = 'src/components/PrivateStudyGroups.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetFuncStart = `const highlightToxicWords = (text: string, toxicWords?: string[]) => {`;
const targetFuncEnd = `export default function PrivateStudyGroups`;

if (code.includes(targetFuncStart) && code.includes(targetFuncEnd)) {
  const parts = code.split(targetFuncStart);
  const funcAndRest = parts[1].split(targetFuncEnd);
  
  const newFunc = `
  if (!isAdmin || !toxicWords || toxicWords.length === 0 || !text) return text;
  
  try {
    const escapedWords = toxicWords.map(w => w.replace(/[.*+?^\\$\\{\\}()|\\[\\]\\\\]/g, '\\\\$&'));
    const regex = new RegExp('(' + escapedWords.join('|') + ')', 'gi');
    
    const textParts = text.split(regex);
    return (
      <>
        {textParts.map((part, i) => {
          const isToxic = toxicWords.some(w => w.toLowerCase() === part.toLowerCase());
          if (isToxic) {
            return <span key={i} className="text-red-600 bg-red-100 px-1 rounded mx-[1px] font-bold border border-red-200">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  } catch (e) {
    return text;
  }
};

`;
  
  const newCode = parts[0] + `const highlightToxicWords = (text: string, toxicWords?: string[], isAdmin?: boolean) => {` + newFunc + targetFuncEnd + funcAndRest[1];
  
  fs.writeFileSync(file, newCode);
  console.log("Patched highlightToxicWords");
}
