import multer from 'multer';
import admin from '../utils/firebase_config.js';

const bucket = admin.storage().bucket();

const storage = multer.memoryStorage();
const upload = multer({ storage });

export { upload, bucket };