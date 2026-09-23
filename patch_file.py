import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

new_logic = """  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!activeGroup) {
        toast.error("No active group selected.");
        return;
    }
    if (!user || !profile) {
        toast.error("Please wait, loading user profile...");
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        toast.error("Only images are supported right now");
        return;
    }

    toast.loading("Sending image...", { id: 'image-upload' });

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX = 800;
            if (width > height) {
                if (width > MAX) {
                    height *= MAX / width;
                    width = MAX;
                }
            } else {
                if (height > MAX) {
                    width *= MAX / height;
                    height = MAX;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const base64Img = canvas.toDataURL('image/jpeg', 0.6);
            
            try {
              await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
                text: "",
                userId: user.uid,
                userName: profile.fullName || profile.username || "Unknown",
                userPhoto: profile.photoURL || null,
                createdAt: serverTimestamp(),
                replyToId: replyingTo?.id || null,
                replyToText: replyingTo?.text || null,
                replyToUser: replyingTo?.userName || null,
                type: 'image',
                imageUrl: base64Img
              });
              setReplyingTo(null);
              toast.success("Image sent!", { id: 'image-upload' });
            } catch (error: any) {
              console.error(error);
              toast.error("Error sending image: " + error?.message, { id: 'image-upload' });
            }
        };
        img.onerror = () => toast.error("Error processing image", { id: 'image-upload' });
        img.src = event.target?.result as string;
    };
    reader.onerror = () => toast.error("Error reading file", { id: 'image-upload' });
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };"""

content = re.sub(
    r'  const handleFileChange = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{.*?(?=  if \(loading\) \{)',
    new_logic + '\n\n',
    content,
    flags=re.DOTALL
)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

