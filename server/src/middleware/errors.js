export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.code === 11000) {
    if (err?.keyPattern?.name) {
      return res.status(409).json({ message: 'Category name already exists' });
    }
    if (err?.keyPattern?.email) {
      return res.status(409).json({ message: 'This email is already registered' });
    }
  }

  const status = err?.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  return res.status(status).json({ message });
}
