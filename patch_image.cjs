const fs = require('fs');

function fixBotImage(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // This is the direct cloudinary URL from the image upload
  const oldUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=chulbul&eyes=closed,closed2,crying,cute,glasses,phew,peeking,sad,wink&mouth=cute,lilSmile,phew,shocked,smile,smileLol,tired,wideSmile`;
  const newUrl = `https://res.cloudinary.com/dbmkuib4p/image/upload/v1723970422/file_0000000033e482088969daf2ba174e0a.png`;
  
  code = code.split(oldUrl).join(newUrl);
  
  fs.writeFileSync(file, code);
  console.log("Fixed image in " + file);
}

fixBotImage('src/pages/AdminDashboard.tsx');
fixBotImage('src/components/AdminStudyGroupModal.tsx');
fixBotImage('src/components/PrivateStudyGroups.tsx');
