import fs from 'fs';
let code = fs.readFileSync('src/pages/Whiteboard.tsx', 'utf8');

code = code.replace(
  "import { Tldraw, exportToBlob } from '@tldraw/tldraw';",
  "import { Tldraw } from '@tldraw/tldraw';"
);

code = code.replace(
  `      const blob = await exportToBlob({
        editor,
        ids: shapeIds,
        format: 'png',
      });`,
  `      const image = await editor.toImage(shapeIds, { format: 'png' });
      const blob = image.blob;`
);

fs.writeFileSync('src/pages/Whiteboard.tsx', code);
console.log("Patched Whiteboard.tsx with editor.toImage");
