import fs from 'fs';
let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

const oldCatch = `    } catch (e: any) {
      console.error(e);
      toast.error("Failed to start video call: " + (e.message || "Unknown error"), { id: 'meet-start' });
    }`;

const newCatch = `    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/popup-closed-by-user') {
        toast.error("Popup was closed. Please select your Google account to start the call.", { id: 'meet-start', duration: 4000 });
      } else if (e.code === 'auth/popup-blocked') {
        toast.error("Popup blocked! Please allow popups for this site to start the call.", { id: 'meet-start', duration: 4000 });
      } else {
        toast.error("Failed to start video call: " + (e.message || "Unknown error"), { id: 'meet-start' });
      }
    }`;

code = code.replace(oldCatch, newCatch);
fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
console.log("Patched catch block");
