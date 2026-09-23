import fs from 'fs';
let code = fs.readFileSync('src/main.tsx', 'utf8');

const unregisterCode = `
// Unregister any existing service workers to prevent MIME type errors in AI Studio iframe
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  }).catch(err => console.error("SW Unregistration error", err));
}
`;

code += "\n" + unregisterCode;

fs.writeFileSync('src/main.tsx', code);
console.log("Patched main.tsx with unregister");
