import jwt from 'jsonwebtoken';

/**
 * Middleware: Verify JWT from Authorization: Bearer <token>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const error = new Error('Access denied. No authentication token provided.');
    error.statusCode = 401;
    return next(error);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const error = new Error('Invalid or expired authentication token.');
      error.statusCode = 403;
      return next(error);
    }

    req.user = decoded; // Contains: { id, email, role, iat, exp }
    next();
  });
}

/**
 * Middleware Factory: Role-Based Access Control (RBAC)
 * Usage: requireRole('admin') or requireRole('admin', 'manager')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const error = new Error('Forbidden. You do not have permission to perform this action.');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
}