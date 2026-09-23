import re

with open("src/components/PostCard.tsx", "r") as f:
    content = f.read()

old_upload = """  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing. Check .env');
    }

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    
    let res;
    try {
      res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: uploadData,
      });
    } catch (err: any) {
      console.error("Fetch error:", err?.message || 'Error');
      throw new Error('Network error (Failed to fetch). Please check if your Cloudinary Cloud Name and Upload Preset in Settings > Secrets are correct, and disable any ad blockers.');
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
    }

    const data = await res.json();
    return data.secure_url;
  };"""

new_upload = """  const uploadFileToCloudinaryLocal = async (file: File): Promise<string> => {
    const { uploadFileToCloudinary } = await import('../lib/cloudinary');
    return uploadFileToCloudinary(file);
  };"""

if old_upload in content:
    content = content.replace(old_upload, new_upload)
    content = content.replace("await uploadFileToCloudinary(file)", "await uploadFileToCloudinaryLocal(file)")
    content = content.replace("await uploadFileToCloudinary(newPdfFile)", "await uploadFileToCloudinaryLocal(newPdfFile)")
    with open("src/components/PostCard.tsx", "w") as f:
        f.write(content)
    print("Patched PostCard.tsx to use centralized uploader")
else:
    print("Could not find uploadFileToCloudinary in PostCard.tsx")
