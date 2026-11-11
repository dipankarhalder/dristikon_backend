import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { msg } from '../constant';

export const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
export const IMAGES_DIR = path.join(UPLOADS_ROOT, 'images');
export const DOCUMENTS_DIR = path.join(UPLOADS_ROOT, 'documents');

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

export const isImageFile = (mimetype: string, ext: string): boolean => {
  return IMAGE_MIME_TYPES.has(mimetype) || IMAGE_EXTENSIONS.has(ext);
};

export const isDocumentFile = (mimetype: string, ext: string): boolean => {
  return DOCUMENT_MIME_TYPES.has(mimetype) || DOCUMENT_EXTENSIONS.has(ext);
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();

    if (isImageFile(mimetype, ext)) {
      cb(null, IMAGES_DIR);
    } else {
      cb(null, DOCUMENTS_DIR);
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();
    const prefix = isImageFile(mimetype, ext) ? 'img' : 'doc';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `${prefix}-${Date.now()}-${randomHex}${ext}`;
    cb(null, safeFilename);
  },
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (isImageFile(mimetype, ext) || isDocumentFile(mimetype, ext)) {
    cb(null, true);
  } else {
    cb(new Error(msg.uploadMsg.invalidFileType));
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

interface MulterErrorWithField extends Error {
  code?: string;
  field?: string;
}

/**
 * Higher-order middleware wrapper that catches Multer errors and sends clean JSON responses
 */
const handleUpload = (multerMiddleware: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: unknown) => {
      if (err) {
        const error = err as MulterErrorWithField;
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            message: msg.uploadMsg.fileSizeExceeded,
          });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            message: `Unexpected upload field '${error.field}'. Use 'file' for single upload or 'files' for multiple upload.`,
          });
        }
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: error.message || msg.uploadMsg.invalidFileType,
        });
      }
      return next();
    });
  };
};

export const uploadSingle = handleUpload(upload.single('file'));
export const uploadMultiple = handleUpload(upload.array('files', 10));

export default {
  uploadSingle,
  uploadMultiple,
  UPLOADS_ROOT,
  IMAGES_DIR,
  DOCUMENTS_DIR,
  isImageFile,
  isDocumentFile,
};
