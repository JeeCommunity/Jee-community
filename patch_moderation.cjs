const fs = require('fs');
let code = fs.readFileSync('src/lib/moderation.ts', 'utf8');

const newToxicWords = `  const toxicWords = [
    'suicide', 'killmyself', 'die', 'murder', 'sucide', 'kill',
    'nude', 'porn', 'sex', 'xvideos', 'brazzers', 'sux',
    'madarchod', 'bhenchod', 'chutiya', 'gandu', 'lawda', 'randi', 'bhosdi', 'mc', 'bc',
    'fuck', 'bitch', 'asshole', 'motherfucker', 'muthiya', 'muthi', 'fck', 'fuk',
    'pela', 'pel', 'spam', 'gali', 'gaali', 'pelunga', 'chod', 'chu'
  ];`;

code = code.replace(/const toxicWords = \[[\s\S]*?\];/, newToxicWords);
fs.writeFileSync('src/lib/moderation.ts', code);
console.log('patched moderation.ts');
