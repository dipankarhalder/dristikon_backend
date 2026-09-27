const server = {
  serveSuccess: 'Server successfully started on port : ',
};

const dbMsg = {
  dbSuccess: 'Database successfully connected on port : 27017.',
  dbFailed: 'Database failed to connect.',
};

const appMsg = {
  somethingWrong: 'Something went wrong, please try again later.',
  internalServerError: 'Internal Server Error',
  apiNotFound: 'The API url not found.',
};

const healthCheck = {
  successMsg: 'API health good, working as expected.',
};

const userMsg = {
  requireName: 'Name should not be blank.',
  requirePhone: 'Phone number should not be blank.',
  requireEmail: 'Email addesss should not be blank.',
  requirePassword: 'Password should not be blank.',
  requireOldPassword: 'Old password should not be blank.',
  requireNewPassword: 'New password should not be blank.',
  requireRole: 'Role should be select a option.',
  validateUserEmail: 'Please enter a valid email address',
  minimumPassword: 'Password must be at least 6 characters.',
  minimumPhone: 'Phone must be at least 10 characters.',
  oldMinimumPassword: 'Old password should be at least 6 characters.',
  newMinimumPassword: 'New password should be at least 6 characters.',
  emailAlreadyExist: 'Provided email is already associated with another user.',
  phoneAlreadyExist: 'Provided phone no is already associated with another user.',
  userNotFound: 'The user is not found.',
  userWrongPassword: 'Entered password is invalid, please try again.',
  compareBothPassword: 'New password should be different from old password',
  newUserCreated: 'New user created successfully.',
  updatedUserPassword: 'Password successfully updated.',
  updatedUserProfile: 'Profile successfully updated.',
  userLoginSuccessfully: 'You are successfully logged-in.',
  userLogoutSuccessfully: 'You are Logged-out successfully.',
  updateSuccess: 'User information successfully updated.',
  existUserEmail: 'Provided email address is not exist!',
  invalidToken: 'Invalid token, please login again.',
  accessDenied: 'Access denied. No token provided.',
  notUserAccess: "Access denied. you don't have permission.",
  expireUserToken: 'The token is expired or invalid.',
  refreshTokenRequired: 'Refresh token is required.',
  invalidRefreshToken: 'Invalid or expired refresh token, please login again.',
  tokenRefreshedSuccessfully: 'Token refreshed successfully.',
};

const categoryMsg = {
  requireCategoryName: 'Category name should not be blank.',
  maxName: 'Category name should not be more than 60 characters.',
  requireDescription: 'Category description should not be blank.',
  maxDescription: 'Category description should not be more than 255 characters.',
  categoryAlreadyExist: 'Provided category is already exist.',
  newCategoryCreated: 'New category created successfully.',
  categoryNotFound: 'The category is not found.',
  categoryDeleted: 'Category deleted successfully.',
};

const consumerMsg = {
  requireConsumerName: 'Consumer name should not be blank.',
  maxName: 'Consumer name should not be more than 60 characters.',
  requireDescription: 'Consumer description should not be blank.',
  maxDescription: 'Consumer description should not be more than 255 characters.',
  consumerAlreadyExist: 'Provided consumer is already exist.',
  newConsumerCreated: 'New consumer created successfully.',
  consumerNotFound: 'The consumer is not found.',
  consumerDeleted: 'Consumer deleted successfully.',
  consumerUpdated: 'Consumer updated successfully.',
};

const eventMsg = {
  newEventCreated: 'New event created successfully.',
  eventNotFound: 'Event not found.',
  eventListRetrieved: 'Event list retrieved successfully.',
};

const transactionMsg = {
  newTransactionCreated: 'Transaction recorded successfully.',
  transactionNotFound: 'Transaction not found.',
  transactionListRetrieved: 'Transaction list retrieved successfully.',
  amountExceeds: 'Paid amount cannot exceed the pending event balance.',
};

module.exports = {
  server,
  dbMsg,
  appMsg,
  healthCheck,
  userMsg,
  categoryMsg,
  consumerMsg,
  eventMsg,
  transactionMsg,
};
