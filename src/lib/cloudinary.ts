import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { uploadMediaToEduTubeCloud } from './edutube';

export interface UploadOptions {
  maxDimension?: number;
  quality?: number;
  folder?: 'uploads' | 'notes' | 'thumbnails' | 'videos';
  onProgress?: (percent: number) => void;
}

/**
 * Compresses an image file using HTML5 Canvas into a compact JPEG Blob & DataURL.
 * Reduces 5 MB camera photos down to ~70 KB so cloud storage never fills up.
 */
async function compressImage(
  file: File,
  maxDimension = 1080,
  quality = 0.8
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, dataUrl });
          } else {
            reject(new Error('Image compression failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

export const uploadFileToCloudinary = async (
  file: File,
  options?: UploadOptions
): Promise<string> => {
  const isImage = file.type.startsWith('image/');
  let compressedData: { blob: Blob; dataUrl: string } | null = null;

  if (isImage && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
    try {
      compressedData = await compressImage(
        file,
        options?.maxDimension ?? 1080,
        options?.quality ?? 0.8
      );
    } catch (err) {
      console.warn('Image compression skipped, using original file:', err);
    }
  }

  // 1. Primary Cloud Storage: Supabase Storage (`edutube-media` public bucket)
  try {
    const targetBlob = compressedData ? compressedData.blob : file;
    const ext = isImage ? 'jpg' : file.name.split('.').pop() || 'bin';
    const baseName = file.name.replace(/\.[^/.]+$/, '').slice(0, 40) || 'file';
    const fileName = `${baseName}.${ext}`;
    const folder = options?.folder || (file.type === 'application/pdf' ? 'notes' : 'uploads');

    const uploaded = await uploadMediaToEduTubeCloud(
      targetBlob,
      fileName,
      folder,
      options?.onProgress
    );
    if (uploaded?.url) {
      return uploaded.url;
    }
  } catch (supaErr) {
    console.warn('Supabase Storage upload fallback:', supaErr);
  }

  // 2. Secondary Cloud Storage: Cloudinary (if configured)
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', compressedData ? compressedData.blob : file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.secure_url;
      }
    } catch (error) {
      console.warn('Error uploading to Cloudinary, falling back:', error);
    }
  }

  // 3. Fallback to Firebase Storage with a short timeout (4 seconds)
  try {
    const uploadPromise = async () => {
      const ext = isImage ? 'jpg' : file.name.split('.').pop() || 'bin';
      const storageRef = ref(
        storage,
        `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
      );
      const snapshot = await uploadBytes(
        storageRef,
        compressedData ? compressedData.blob : file
      );
      return await getDownloadURL(snapshot.ref);
    };

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 4000)
    );

    return await Promise.race([uploadPromise(), timeoutPromise]);
  } catch {
    if (compressedData?.dataUrl) {
      return compressedData.dataUrl;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to Base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  }
};
