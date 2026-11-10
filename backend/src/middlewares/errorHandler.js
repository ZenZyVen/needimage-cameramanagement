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

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
}

module.exports = { errorHandler };
