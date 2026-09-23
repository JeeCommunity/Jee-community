const fs = require('fs');

let file = 'src/components/PostCard.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetContent = `<p className="text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{post.text}</p>`;
const replaceContent = `<p className="text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{post.text}</p>
              
              {post.isToxic && post.toxicWords && post.toxicWords.length > 0 && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl p-3">
                   <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-red-700 dark:text-red-400">Content Warning</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-red-600 dark:text-red-400">Flagged Words:</span>
                      {post.toxicWords.map((word: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-bold">
                          {word}
                        </span>
                      ))}
                   </div>
                </div>
              )}`;
              
if (code.includes(targetContent) && !code.includes('Content Warning')) {
  code = code.replace(targetContent, replaceContent);
}

fs.writeFileSync(file, code);
