/**
 * Generic Request Validation Middleware using Zod
 * Validates req.body against a provided Zod schema.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const formattedErrors = issues.map((err) => ({
        field: Array.isArray(err.path) && err.path.length > 0 ? err.path.join('.') : 'body',
        message: err.message,
      }));

      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    // Replace req.body with the sanitized and coerced data from Zod
    req.body = result.data;
    next();
  };
}
