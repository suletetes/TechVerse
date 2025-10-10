// Cloudinary Configuration
// TODO: Configure Cloudinary for image uploads

import { v2 as cloudinary } from 'cloudinary';

// TODO: Configure Cloudinary
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
};

// TODO: Initialize configuration
if (process.env.CLOUDINARY_CLOUD_NAME) {
  configureCloudinary();
} else {
  console.warn('⚠️ Cloudinary configuration missing. Image uploads will not work.');
}

export default cloudinary;