// File Upload Middleware
// TODO: Implement file upload using Multer

import multer from 'multer';
import path from 'path';
import { UPLOAD_SETTINGS } from '../utils/constants.js';

// TODO: Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // TODO: Set upload destination
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // TODO: Set filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // TODO: Implement file type validation
  if (UPLOAD_SETTINGS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_SETTINGS.MAX_FILE_SIZE,
    files: UPLOAD_SETTINGS.MAX_FILES_PER_UPLOAD
  },
  fileFilter: fileFilter
});

// Export different upload configurations
export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);

export default upload;