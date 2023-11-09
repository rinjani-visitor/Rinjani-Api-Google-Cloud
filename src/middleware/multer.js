import multer from 'multer';
import path from 'path';

const storage = (folder) => multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExtension);
  },
});

const upload = (folder) => multer({ 
    storage: storage(folder),
    limits: {
        fileSize: 5 * 1000 * 1000 // 5 MB
    }
});

export default upload;