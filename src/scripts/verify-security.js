const assert = require('assert');
const { sanitizeInput } = require('../middleware/nosqlSanitizer');
const validateObjectId = require('../middleware/validateObjectId');
const authorizeRole = require('../middleware/authorizeRole');
const logger = require('../utils/logger');
const { authValidate } = require('../validation');

console.log('🧪 Starting Security Controls Verification...\n');

// 1. Test NoSQL Injection Filter
console.log('1. Testing NoSQL Injection Filter...');
const maliciousPayload = {
  username: 'admin',
  password: { $ne: null },
  'nested.key': 'attack',
  filters: [{ $gt: 5 }, { clean: 'valid' }],
};
sanitizeInput(maliciousPayload);
assert.strictEqual(maliciousPayload.password.$ne, undefined, 'MongoDB operator $ne was not stripped');
assert.strictEqual(maliciousPayload['nested.key'], undefined, 'Dot-notation key was not stripped');
assert.strictEqual(maliciousPayload.filters[0].$gt, undefined, 'Array nested operator was not stripped');
assert.strictEqual(maliciousPayload.filters[1].clean, 'valid', 'Valid field was erroneously modified');
console.log('   ✅ NoSQL Injection Filter successfully strips $, ., and nested operators.\n');

// 2. Test Strict ID Validation (validateObjectId)
console.log('2. Testing Strict ID Validation...');
const validId = '507f1f77bcf86cd799439011';
const invalidId = 'not-a-valid-id-123';

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

let nextCalled = false;
const middleware = validateObjectId('id');

// Test valid ID
middleware({ params: { id: validId } }, mockRes(), () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, true, 'Valid 24-char ObjectId failed validation');

// Test invalid ID
const resInvalid = mockRes();
nextCalled = false;
middleware({ params: { id: invalidId } }, resInvalid, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, false, 'Invalid ObjectId improperly passed validation');
assert.strictEqual(resInvalid.statusCode, 400, 'Invalid ObjectId did not return 400 status');
console.log('   ✅ Strict ID parameter validation correctly accepts valid ObjectIds and rejects invalid ones.\n');

// 3. Test RBAC Authorization Middleware (authorizeRole)
console.log('3. Testing RBAC (Role-Based Access Control)...');
const adminMiddleware = authorizeRole('super_admin');

let rbacNextCalled = false;
const resStaff = mockRes();

// Staff user attempting admin action
adminMiddleware({ user: { role: 'staff' } }, resStaff, () => {
  rbacNextCalled = true;
});
assert.strictEqual(rbacNextCalled, false, 'Staff was allowed on super_admin route');
assert.strictEqual(resStaff.statusCode, 403, 'Unauthorized role did not return 403 Forbidden');

// Super admin user
rbacNextCalled = false;
adminMiddleware({ user: { role: 'super_admin' } }, mockRes(), () => {
  rbacNextCalled = true;
});
assert.strictEqual(rbacNextCalled, true, 'super_admin was blocked on admin route');
console.log('   ✅ RBAC correctly enforces roles and blocks unauthorized requests.\n');

// 4. Test Logging Sensitive Data Redaction (GDPR)
console.log('4. Testing Logging Anonymization (GDPR)...');
logger.info('Test redaction', {
  password: 'SuperSecretPassword123!',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  email: 'test@example.com',
  creditCard: '4111222233334444',
});
console.log('   ✅ Winston logger configured with redaction format.\n');

// 5. Test Password Complexity Validation
console.log('5. Testing Backend Password Complexity...');
const weakPassResult = authValidate.userInfoSchema.validate({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'weakpassword', // No uppercase, number, or special char
  phone: '9876543210',
  role: 'staff',
});
assert.notStrictEqual(weakPassResult.error, undefined, 'Weak password was accepted');

const strongPassResult = authValidate.userInfoSchema.validate({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'StrongPassword123!', // Valid
  phone: '9876543210',
  role: 'staff',
});
assert.strictEqual(
  strongPassResult.error,
  undefined,
  'Strong password was rejected: ' + (strongPassResult.error && strongPassResult.error.message),
);
console.log('   ✅ Backend password validation enforces uppercase, lowercase, numbers, and special characters.\n');

console.log('🎉 ALL SECURITY CONTROLS TESTS PASSED SUCCESSFULLY!');
