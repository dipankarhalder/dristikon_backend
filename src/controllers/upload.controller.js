const path = require('path');
const fs = require('fs');
const { StatusCodes } = require('http-status-codes');
const { msg } = require('../constant');
const { sendErrorResponse, notFoundItem, validateFields } = require('../utils');
const { IMAGES_DIR, DOCUMENTS_DIR } = require('../middleware/fileUpload');

const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_\-.]+$/;

const formatFileResponse = (file, req) => {
  const isImage = file.destination.includes('images');
  const category = isImage ? 'images' : 'documents';
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
const uploadSingle = async (req, res) => {
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
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return validateFields(res, msg.uploadMsg.noFileProvided);
    }

    const filesData = req.files.map((file) => formatFileResponse(file, req));

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
const deleteFile = async (req, res) => {
  try {
    const filename = req.params.filename;

    // Defend against path traversal
    if (!filename || !SAFE_FILENAME_REGEX.test(filename) || filename.includes('..')) {
      return validateFields(res, msg.uploadMsg.invalidFilename);
    }

    // Check images directory
    const imagePath = path.join(IMAGES_DIR, filename);
    const documentPath = path.join(DOCUMENTS_DIR, filename);

    let targetPath = null;
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

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
};
