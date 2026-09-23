const fs = require('fs');

function fixBotImage(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // The current URL is the broken cloudinary one
  const oldUrl = `https://res.cloudinary.com/dbmkuib4p/image/upload/v1723970422/file_0000000033e482088969daf2ba174e0a.png`;
  const newUrl = `/chulbul.png`;
  
  code = code.split(oldUrl).join(newUrl);
  
  // Also just in case the previous patch missed some, let's replace dicebear if any are left
  code = code.split(`https://api.dicebear.com/9.x/fun-emoji/svg?seed=chulbul&eyes=closed,closed2,crying,cute,glasses,phew,peeking,sad,wink&mouth=cute,lilSmile,phew,shocked,smile,smileLol,tired,wideSmile`).join(newUrl);
  code = code.split(`https://api.dicebear.com/7.x/bottts/svg?seed=chulbul&transparent=true`).join(newUrl);
  code = code.split(`https://api.dicebear.com/7.x/bottts/svg?seed=chulbul`).join(newUrl);

  fs.writeFileSync(file, code);
  console.log("Fixed image in " + file);
}

fixBotImage('src/pages/AdminDashboard.tsx');
fixBotImage('src/components/AdminStudyGroupModal.tsx');
fixBotImage('src/components/PrivateStudyGroups.tsx');
