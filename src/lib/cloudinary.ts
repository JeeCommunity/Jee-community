import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UploadOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Compresses an image file using HTML5 Canvas into a compact JPEG Blob & DataURL.
 * Ensures fast uploads and guarantees Base64 fallbacks stay well under Firestore's 1MB limit.
 */
async function compressImage(
  file: File,
  maxDimension = 900,
  quality = 0.78
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
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const isImage = file.type.startsWith('image/');
  let compressedData: { blob: Blob; dataUrl: string } | null = null;

  if (isImage) {
    try {
      compressedData = await compressImage(
        file,
        options?.maxDimension ?? 900,
        options?.quality ?? 0.78
      );
    } catch (err) {
      console.warn('Image compression skipped, using original file:', err);
    }
  }

  // 1. Try Cloudinary first if configured
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
      console.warn('Cloudinary upload failed, falling back...');
    } catch (error) {
      console.warn('Error uploading to Cloudinary, falling back:', error);
    }
  }

  // 2. Fallback to Firebase Storage with a short timeout (4 seconds)
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
  } catch (storageError) {
    console.warn(
      'Firebase storage failed or timed out, using compressed Base64 fallback:',
      storageError
    );

    // 3. Final Fallback: Compressed Base64 Data URL for images, or FileReader for small files
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
