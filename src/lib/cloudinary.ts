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

  // Fallback to Firebase Storage (for large files or if Cloudinary fails/not configured)
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Please enable it in Firebase Console.');
  }

  try {
      // Direct upload without compression to avoid hanging on mobile
      const fileRef = ref(storage, `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`);
      
      // Wrap Firebase upload in a timeout
      const uploadPromise = async () => {
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      };
      
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Upload timed out! Kya aapne Firebase Console mein 'Storage' enable kiya hai? Agar nahi, toh usko Get Started par click karke enable karein.")), 20000)
      );

      const url = await Promise.race([uploadPromise(), timeoutPromise]);
      return url;
  } catch (err: any) {
      console.error("Firebase Storage Upload error:", err);
      // Give a very clear Hindi/English error message for the user to understand
      throw new Error(err.message || 'Firebase Storage error. Please check if Storage is enabled in Firebase Console.');
  }
};
