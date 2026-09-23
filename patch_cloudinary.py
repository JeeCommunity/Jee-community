import re

with open("src/lib/cloudinary.ts", "r") as f:
    content = f.read()

new_content = """import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  // Try Cloudinary first if configured
  if (cloudName && uploadPreset) {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    
    let res;
    try {
      res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: uploadData,
      });
      if (res.ok) {
         const data = await res.json();
         return data.secure_url;
      } else {
         const errorData = await res.json().catch(() => ({}));
         console.warn("Cloudinary upload returned error:", errorData);
         throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
      }
    } catch (err: any) {
      console.warn("Cloudinary upload failed", err);
      // We will not fallback to Firebase if Cloudinary is explicitly configured but failing,
      // to avoid silent hanging if Firebase storage is not set up.
      throw new Error(err.message || 'Failed to upload image. Please check Cloudinary settings.');
    }
  }

  // Fallback to Firebase Storage
  if (!storage) {
    throw new Error('Storage is not configured. Please add Cloudinary or Firebase Storage settings.');
  }

  try {
      // Direct upload without compression to avoid hanging on mobile
      const fileRef = ref(storage, `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      return url;
  } catch (err: any) {
      console.error("Firebase Storage Upload error:", err);
      throw new Error(err.message || 'Failed to upload file to storage');
  }
};
"""

with open("src/lib/cloudinary.ts", "w") as f:
    f.write(new_content)
