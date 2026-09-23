import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

old_upload = """  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) { // 1MB limit
        toast.error("Image must be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditGroupPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };"""

new_upload = """  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setEditGroupPhoto(dataUrl);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };"""

content = content.replace(old_upload, new_upload)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

