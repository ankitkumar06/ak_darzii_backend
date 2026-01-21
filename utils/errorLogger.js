const ErrorLog = require('../models/ErrorLog');

// Function to log errors to database
const logErrorToDatabase = async (errorData) => {
  try {
    const {
      errorType = 'Unknown Error',
      errorMessage = 'No message provided',
      errorStack,
      userId = null,
      email = null,
      endpoint = null,
      method = null,
      statusCode = 500,
      requestData = null,
      ipAddress = null,
      userAgent = null,
      severity = 'medium',
      notes = null
    } = errorData;

    const errorLog = new ErrorLog({
      errorType,
      errorMessage: errorMessage || 'No message provided',
      errorStack,
      userId,
      email,
      endpoint,
      method,
      statusCode,
      requestData,
      ipAddress,
      userAgent,
      severity,
      notes,
      createdAt: new Date()
    });

    const savedLog = await errorLog.save();
    console.log('✅ Error logged to database:', savedLog._id);
    return savedLog;
  } catch (err) {
    console.error('❌ Failed to log error to database:', err.message);
    console.error('Error data was:', err);
    // Don't throw error here to prevent infinite loops
  }
};

// Helper function to extract error details from request/error
const getErrorDetails = (error, req = null, additionalData = {}) => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
  
  return {
    errorMessage,
    errorStack: error?.stack || null,
    endpoint: req?.originalUrl || additionalData.endpoint || null,
    method: req?.method || additionalData.method || null,
    requestData: req?.body || additionalData.requestData || null,
    ipAddress: req?.ip || req?.connection?.remoteAddress || additionalData.ipAddress || null,
    userAgent: req?.headers?.['user-agent'] || additionalData.userAgent || null,
    ...additionalData
  };
};

module.exports = {
  logErrorToDatabase,
  getErrorDetails
};
