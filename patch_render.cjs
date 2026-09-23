const fs = require('fs');
let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

const helper = `
const highlightToxicWords = (text: string, toxicWords?: string[]) => {
  if (!toxicWords || toxicWords.length === 0 || !text) return text;
  
  try {
    const escapedWords = toxicWords.map(w => w.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'));
    const regex = new RegExp('(' + escapedWords.join('|') + ')', 'gi');
    
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => {
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

export default function PrivateStudyGroups`;

code = code.replace("export default function PrivateStudyGroups", helper);

const textRenderTarget = `{msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all min-w-0 max-w-full" style={{ wordBreak: 'break-word' }}>{msg.text}</div>}`;
const textRenderReplacement = `{msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all min-w-0 max-w-full" style={{ wordBreak: 'break-word' }}>{highlightToxicWords(msg.text, msg.toxicWords)}</div>}`;

if (code.includes(textRenderTarget)) {
   code = code.replace(textRenderTarget, textRenderReplacement);
   fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
   console.log("Render patched!");
} else {
   console.log("Could not find textRenderTarget");
}
