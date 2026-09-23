const fs = require('fs');

function fixBotImage(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace the broken cloudinary URL in addDoc calls
  const brokenUrl = `https://res.cloudinary.com/dbmkuib4p/image/upload/v1723969443/file_0000000033e482088969daf2ba174e0a.png`;
  const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=chulbul`; // Transparent bot
  
  code = code.split(brokenUrl).join(fallbackUrl);

  // Hardcode the image in the UI so old messages also get fixed
  // target: <img src={msg.userPhoto} alt="Chulbul" className="w-full h-auto object-contain drop-shadow-2xl" />
  // replace with: <img src={msg.userId === 'inspector-chulbul-bot' ? "https://api.dicebear.com/7.x/bottts/svg?seed=chulbul" : msg.userPhoto} ...
  
  const imgTarget = `<img src={msg.userPhoto} alt="Chulbul" className="w-full h-auto object-contain drop-shadow-2xl" />`;
  const imgReplacement = `<img src="https://api.dicebear.com/7.x/bottts/svg?seed=chulbul" alt="Chulbul" className="w-full h-auto object-contain drop-shadow-2xl" />`;
  
  code = code.split(imgTarget).join(imgReplacement);
  
  fs.writeFileSync(file, code);
  console.log("Fixed image in " + file);
}

fixBotImage('src/pages/AdminDashboard.tsx');
fixBotImage('src/components/AdminStudyGroupModal.tsx');
fixBotImage('src/components/PrivateStudyGroups.tsx');
