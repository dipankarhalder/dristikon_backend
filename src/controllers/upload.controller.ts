import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { msg } from '../constant';
import { sendErrorResponse, notFoundItem, validateFields } from '../utils';
import { IMAGES_DIR, DOCUMENTS_DIR } from '../middleware/fileUpload';

const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_\-.]+$/;

export interface FormattedFileResponse {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  category: 'images' | 'documents';
  url: string;
  fullUrl: string;
}

export const formatFileResponse = (file: Express.Multer.File, req: Request): FormattedFileResponse => {
  const isImage = file.destination.includes('images');
  const category: 'images' | 'documents' = isImage ? 'images' : 'documents';
  const relativeUrl = `/uploads/${category}/${file.filename}`;
  const protocol = req.protocol;
  const host = req.get('host');
  const fullUrl = `${protocol}://${host}${relativeUrl}`;

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    category,
    url: relativeUrl,
    fullUrl,
  };
};

/* single file upload */
export const uploadSingle = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file) {
      return validateFields(res, msg.uploadMsg.noFileProvided);
    }

    const fileData = formatFileResponse(req.file, req);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.uploadMsg.fileUploaded,
      file: fileData,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* multiple file upload */
export const uploadMultiple = async (req: Request, res: Response): Promise<Response> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return validateFields(res, msg.uploadMsg.noFileProvided);
    }

    const filesData = files.map((file) => formatFileResponse(file, req));

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.uploadMsg.filesUploaded,
      count: filesData.length,
      files: filesData,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* delete uploaded file */
export const deleteFile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const rawFilename = req.params.filename;
    const filename = typeof rawFilename === 'string' ? rawFilename : '';

    // Defend against path traversal
    if (!filename || !SAFE_FILENAME_REGEX.test(filename) || filename.includes('..')) {
      return validateFields(res, msg.uploadMsg.invalidFilename);
    }

    // Check images directory
    const imagePath = path.join(IMAGES_DIR, filename);
    const documentPath = path.join(DOCUMENTS_DIR, filename);

    let targetPath: string | null = null;
    if (fs.existsSync(imagePath)) {
      targetPath = imagePath;
    } else if (fs.existsSync(documentPath)) {
      targetPath = documentPath;
    }

    if (!targetPath) {
      return notFoundItem(res, msg.uploadMsg.fileNotFound);
    }

    fs.unlinkSync(targetPath);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.uploadMsg.fileDeleted,
      filename,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export default {
  uploadSingle,
  uploadMultiple,
  deleteFile,
};
