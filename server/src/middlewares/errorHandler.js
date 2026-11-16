export const errorHandler = (err, req, res, next) => {
  // 1. Log the error on the server console for debugging
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);

  // 2. Extract status code (default to 500 if not specified)
  const statusCode = err.statusCode || err.status || 500;

  // 3. Send a clean, consistent JSON response to the client
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message || 'Internal Server Error',
  });
};