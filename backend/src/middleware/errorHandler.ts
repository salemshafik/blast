import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Log error for debugging
  console.error(`Error ${statusCode}: ${message}`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: {
      message: isDevelopment ? message : 'Internal Server Error',
      ...(isDevelopment && { stack: error.stack }),
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`) as ApiError;
  error.statusCode = 404;
  next(error);
};
