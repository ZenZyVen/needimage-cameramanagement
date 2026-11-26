function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err);

  // Multer error handling
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  // Prisma unique constraint violation error code P2002
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${fields} already exists.`
    });
  }

  // Prisma foreign key constraint failure P2003
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint violation: referenced item does not exist or is currently in use.'
    });
  }

  // Prisma record not found P2025
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'The requested resource was not found.'
    });
  }

  // Upload / CORS validation errors
  if (err.message && (err.message.includes('Only valid image files') || err.message.includes('Invalid file name'))) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.message === 'Origin not allowed by CORS policy') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed.'
    });
  }

  const statusCode = err.statusCode || 500;
  // Do not leak internal database/system error messages on 500 responses
  const safeMessage = statusCode === 500
    ? 'An unexpected internal server error occurred.'
    : (err.message || 'Request could not be processed.');

  return res.status(statusCode).json({
    success: false,
    message: safeMessage
  });
}

module.exports = { errorHandler };
