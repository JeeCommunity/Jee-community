
export function getToxicWords(text: string): string[] {
  if (!text) return [];
  
  const t = text.toLowerCase();
  
  const normalized = t
    .replace(/@/g, 'a')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/[€£]/g, 'e')
    .replace(/[*#\-]/g, ''); // strip asterisks, hashes, dashes

  const strippedAlpha = normalized.replace(/[^a-z]/g, '');

    const toxicWords = [
    'suicide', 'killmyself', 'die', 'murder', 'sucide', 'kill',
    'nude', 'porn', 'sex', 'xvideos', 'brazzers', 'sux',
    'madarchod', 'bhenchod', 'chutiya', 'gandu', 'lawda', 'randi', 'bhosdi', 'mc', 'bc',
    'fuck', 'bitch', 'asshole', 'motherfucker', 'muthiya', 'muthi', 'fck', 'fuk',
    'pela', 'pel', 'spam', 'gali', 'gaali', 'pelunga', 'chod', 'chu'
  ];

  const found = new Set<string>();

  toxicWords.forEach(word => {
    // Check if the word is in the normalized string or the fully stripped string
    if (normalized.includes(word) || (word.length >= 4 && strippedAlpha.includes(word))) {
      found.add(word);
    }
  });

  return Array.from(found);
}

export function checkToxicity(text: string): boolean {
  return getToxicWords(text).length > 0;
}
