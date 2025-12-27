const errorHandler = (res, error, defaultMessage = 'An error occurred') => {
  console.error('Error:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = { errorHandler };