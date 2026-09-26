import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  // Cloudinary free tier has a 10MB limit for raw files (like PDFs).
  const isLargeFile = file.size > 10 * 1024 * 1024;

  // Try Cloudinary first if configured AND file is small enough
  if (cloudName && uploadPreset && !isLargeFile) {
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
         console.warn("Cloudinary upload returned error, falling back to Firebase:", errorData);
      }
    } catch (err: any) {
      console.warn("Cloudinary fetch failed, falling back to Firebase", err);
    }
  }

  // Try Firebase Storage if configured
  if (storage) {
    try {
      const fileRef = ref(storage, `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`);
      
      const uploadPromise = async () => {
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      };
      
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Firebase Storage upload timed out")), 15000)
      );

      const url = await Promise.race([uploadPromise(), timeoutPromise]);
      return url;
    } catch (err: any) {
      console.warn("Firebase Storage upload failed, using local Base64 fallback:", err);
    }
  }

  // Final infallible fallback: Convert to Base64 data URL so posts/images always upload successfully!
  try {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  } catch (base64Err: any) {
    console.error("Base64 conversion error:", base64Err);
    throw new Error("Failed to upload file. Please try again with a smaller file.");
  }
};
