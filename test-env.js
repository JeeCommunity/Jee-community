import dotenv from 'dotenv';
dotenv.config();
console.log('CLOUD_NAME:', !!process.env.VITE_CLOUDINARY_CLOUD_NAME);
