const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const { msg } = require('../constant');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const IMAGES_DIR = path.join(UPLOADS_ROOT, 'images');
const DOCUMENTS_DIR = path.join(UPLOADS_ROOT, 'documents');

// Ensure destination directories exist
[IMAGES_DIR, DOCUMENTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Allowed MIME types
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

// Allowed extensions
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);
const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx', '.ppt', '.pptx']);

const isImageFile = (mimetype, ext) => {
  return IMAGE_MIME_TYPES.has(mimetype) || IMAGE_EXTENSIONS.has(ext);
};

const isDocumentFile = (mimetype, ext) => {
  return DOCUMENT_MIME_TYPES.has(mimetype) || DOCUMENT_EXTENSIONS.has(ext);
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();

    if (isImageFile(mimetype, ext)) {
      cb(null, IMAGES_DIR);
    } else {
      cb(null, DOCUMENTS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();
    const prefix = isImageFile(mimetype, ext) ? 'img' : 'doc';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `${prefix}-${Date.now()}-${randomHex}${ext}`;
    cb(null, safeFilename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (isImageFile(mimetype, ext) || isDocumentFile(mimetype, ext)) {
    cb(null, true);
  } else {
    cb(new Error(msg.uploadMsg.invalidFileType), false);
  }
};

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Higher-order middleware wrapper that catches Multer errors and sends clean JSON responses
 */
const handleUpload = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            message: msg.uploadMsg.fileSizeExceeded,
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            message: `Unexpected upload field '${err.field}'. Use 'file' for single upload or 'files' for multiple upload.`,
          });
        }
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: err.message || msg.uploadMsg.invalidFileType,
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle: handleUpload(upload.single('file')),
  uploadMultiple: handleUpload(upload.array('files', 10)),
  UPLOADS_ROOT,
  IMAGES_DIR,
  DOCUMENTS_DIR,
};
