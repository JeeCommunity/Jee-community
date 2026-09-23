import fs from 'fs';
let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

code = code.replace("FileText, Send, MoreVertical,", "FileText, Send, MoreVertical, Video, Palette,");

const startMeetLogic = `
  const handleStartMeet = async () => {
    if (!activeGroup || !user) return;
    try {
      toast.loading("Starting video call...", { id: 'meet-start' });
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) throw new Error("Could not get access token");

      const response = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${credential.accessToken}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const meetData = await response.json();
      if (!response.ok) throw new Error(meetData.error?.message || "Failed to create meeting");

      await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
        text: \`Join the Video Call! 📹\n\${meetData.meetingUri}\`,
        userId: user.uid,
        userName: profile?.fullName || profile?.username || "Unknown",
        userPhoto: profile?.photoURL || null,
        createdAt: serverTimestamp(),
        type: 'meet',
        meetUri: meetData.meetingUri,
        isToxic: false,
        toxicWords: []
      });
      
      toast.success("Video call started!", { id: 'meet-start' });
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to start video call: " + (e.message || "Unknown error"), { id: 'meet-start' });
    }
  };
`;

code = code.replace("const handleSendMessage =", startMeetLogic + "\n  const handleSendMessage =");

fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
console.log("Patched PrivateStudyGroups.tsx");
