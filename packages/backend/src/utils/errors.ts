export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message, 'RATE_LIMIT');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(503, message, 'SERVICE_UNAVAILABLE');
  }
}

export function isFirestoreUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: number | string }).code;
  return (
    code === 7 ||
    error.message.includes('Cloud Firestore API has not been used') ||
    error.message.includes('PERMISSION_DENIED')
  );
}
