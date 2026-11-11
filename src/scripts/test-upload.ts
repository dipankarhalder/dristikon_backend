import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { uploadSingle, uploadMultiple, deleteFile } from '../controllers/upload.controller';
import { IMAGES_DIR, DOCUMENTS_DIR } from '../middleware/fileUpload';

console.log('🧪 Starting File Upload Tests...\n');

interface UploadFileResponse {
  category: string;
  mimetype: string;
  url: string;
  fullUrl: string;
}

interface UploadResponseBody {
  file?: UploadFileResponse;
  files?: UploadFileResponse[];
  count?: number;
  message?: string;
  [key: string]: unknown;
}

interface MockResponse {
  statusCode: number;
  body: UploadResponseBody;
  status(code: number): MockResponse;
  json(data: UploadResponseBody): MockResponse;
}

const mockReq = (
  file: Express.Multer.File | null = null,
  files: Express.Multer.File[] | null = null,
  params: Record<string, string> = {},
): Request =>
  ({
    file: file as Express.Multer.File,
    files: files as Express.Multer.File[],
    params,
    protocol: 'http',
    get: () => 'localhost:4000',
  }) as unknown as Request;

const mockRes = (): MockResponse => {
  const res: Partial<MockResponse> = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res as MockResponse;
  };
  res.json = (data: UploadResponseBody) => {
    res.body = data;
    return res as MockResponse;
  };
  return res as MockResponse;
};

(async () => {
  // 1. Test Single Image Upload Formatter
  console.log('1. Testing Single Image Upload response...');
  const fakeImageFile = {
    fieldname: 'file',
    originalname: 'avatar.png',
    encoding: '7bit',
    mimetype: 'image/png',
    destination: IMAGES_DIR,
    filename: `img-${Date.now()}-abc12345.png`,
    path: path.join(IMAGES_DIR, `img-${Date.now()}-abc12345.png`),
    size: 102400,
  } as Express.Multer.File;
  fs.writeFileSync(fakeImageFile.path, 'fake image binary content');

  const res1 = mockRes();
  await uploadSingle(mockReq(fakeImageFile), res1 as unknown as Response);

  assert.strictEqual(res1.statusCode, 200);
  assert.strictEqual(res1.body.file!.category, 'images');
  assert.strictEqual(res1.body.file!.mimetype, 'image/png');
  assert.ok(res1.body.file!.url.startsWith('/uploads/images/'));
  assert.ok(res1.body.file!.fullUrl.startsWith('http://localhost:4000/uploads/images/'));
  console.log('   ✅ Single image upload formatted successfully.\n');

  // 2. Test Single PDF Document Upload Formatter
  console.log('2. Testing Single PDF Document Upload response...');
  const fakeDocFile = {
    fieldname: 'file',
    originalname: 'contract.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    destination: DOCUMENTS_DIR,
    filename: `doc-${Date.now()}-def67890.pdf`,
    path: path.join(DOCUMENTS_DIR, `doc-${Date.now()}-def67890.pdf`),
    size: 204800,
  } as Express.Multer.File;
  fs.writeFileSync(fakeDocFile.path, '%PDF-1.4 fake pdf content');

  const res2 = mockRes();
  await uploadSingle(mockReq(fakeDocFile), res2 as unknown as Response);

  assert.strictEqual(res2.statusCode, 200);
  assert.strictEqual(res2.body.file!.category, 'documents');
  assert.strictEqual(res2.body.file!.mimetype, 'application/pdf');
  assert.ok(res2.body.file!.url.startsWith('/uploads/documents/'));
  console.log('   ✅ Single PDF document upload formatted successfully.\n');

  // 3. Test Multiple Files Upload
  console.log('3. Testing Multiple Files Upload response...');
  const res3 = mockRes();
  await uploadMultiple(mockReq(null, [fakeImageFile, fakeDocFile]), res3 as unknown as Response);

  assert.strictEqual(res3.statusCode, 200);
  assert.strictEqual(res3.body.count, 2);
  assert.strictEqual(res3.body.files!.length, 2);
  console.log('   ✅ Multiple files upload handled successfully.\n');

  // 4. Test Missing File validation
  console.log('4. Testing Missing File Validation...');
  const res4 = mockRes();
  await uploadSingle(mockReq(null), res4 as unknown as Response);
  assert.strictEqual(res4.statusCode, 400);
  console.log('   ✅ Missing file correctly returns 400 Bad Request.\n');

  // 5. Test File Deletion
  console.log('5. Testing File Deletion...');
  const res5 = mockRes();
  await deleteFile(mockReq(null, null, { filename: fakeImageFile.filename }), res5 as unknown as Response);

  assert.strictEqual(res5.statusCode, 200);
  assert.strictEqual(fs.existsSync(fakeImageFile.path), false, 'Deleted file still exists on disk');

  // Cleanup fake doc file
  const res5b = mockRes();
  await deleteFile(mockReq(null, null, { filename: fakeDocFile.filename }), res5b as unknown as Response);
  assert.strictEqual(res5b.statusCode, 200);
  assert.strictEqual(fs.existsSync(fakeDocFile.path), false);
  console.log('   ✅ File deletion successfully removes file from disk.\n');

  // 6. Test Path Traversal Protection on Deletion
  console.log('6. Testing Path Traversal Defense...');
  const res6 = mockRes();
  await deleteFile(mockReq(null, null, { filename: '../../etc/passwd' }), res6 as unknown as Response);
  assert.strictEqual(res6.statusCode, 400);
  console.log('   ✅ Path traversal attempt blocked with 400 Bad Request.\n');

  // 7. Test Non-existent File Deletion
  console.log('7. Testing Non-existent File Deletion...');
  const res7 = mockRes();
  await deleteFile(mockReq(null, null, { filename: 'doc-9999999999-nonexistent.pdf' }), res7 as unknown as Response);
  assert.strictEqual(res7.statusCode, 404);
  console.log('   ✅ Non-existent file returns 404 Not Found.\n');

  console.log('🎉 ALL FILE UPLOAD TESTS PASSED SUCCESSFULLY!');
})();
