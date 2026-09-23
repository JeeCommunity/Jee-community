const fs = require('fs');

function replaceImageInFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Both pages and components use the dicebear api right now for Chulbul
  const target = `https://api.dicebear.com/7.x/bottts/svg?seed=chulbul&transparent=true`;
  const replacement = `https://res.cloudinary.com/dbmkuib4p/image/upload/v1723969443/file_0000000033e482088969daf2ba174e0a.png`;

  if (code.includes(target)) {
    // replace all occurrences
    code = code.split(target).join(replacement);
    fs.writeFileSync(filePath, code);
    console.log("Patched image URL in " + filePath);
  }
}

replaceImageInFile('src/pages/AdminDashboard.tsx');
replaceImageInFile('src/components/AdminStudyGroupModal.tsx');
