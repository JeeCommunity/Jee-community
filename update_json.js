import fs from 'fs';
const config = {
  "projectId": "community-6fe4e",
  "appId": "1:1018138805762:web:33971daf806aef642d091b",
  "apiKey": "AIzaSyCuELMNcijNlUjuegK3qoIKiwnEyoFMGHQ",
  "authDomain": "community-6fe4e.firebaseapp.com",
  "storageBucket": "community-6fe4e.firebasestorage.app",
  "messagingSenderId": "1018138805762",
  "measurementId": "G-88CHZP0V5H"
};
fs.writeFileSync('firebase-applet-config.json', JSON.stringify(config, null, 2));
console.log("Updated firebase-applet-config.json");
