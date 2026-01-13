// 错误处理系统

export enum ErrorType {
  CONFIG = 'config',
  AI = 'ai',
  TOOL = 'tool',
  FILE = 'file',
  NETWORK = 'network',
  GIT = 'git',
  SESSION = 'session',
  UNKNOWN = 'unknown',
}

export interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: Date;
}

export class ErrorHandler {
  private errors: AppError[] = [];

  handleError(
    error: Error | AppError | unknown,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string
  ): AppError {
    const timestamp = new Date();

    if (error instanceof Error) {
      const appError: AppError = {
        type,
        code: code || 'UNKNOWN_ERROR',
        message: error.message,
        stack: error.stack,
        timestamp,
      };
      this.errors.push(appError);
      return appError;
    } else if (typeof error === 'object' && error !== null && 'type' in error) {
      const appError = error as AppError;
      appError.timestamp = timestamp;
      this.errors.push(appError);
      return appError;
    } else {
      const appError: AppError = {
        type,
        code: code || 'UNKNOWN_ERROR',
        message: String(error),
        timestamp,
      };
      this.errors.push(appError);
      return appError;
    }
  }

  getErrors(type?: ErrorType): AppError[] {
    if (type) {
      return this.errors.filter(e => e.type === type);
    }
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getLastError(): AppError | null {
    return this.errors[this.errors.length - 1] || null;
  }

  formatError(error: AppError): string {
    let output = `[${error.type}] ${error.code}: ${error.message}`;

    if (error.details) {
      output += `\n详情: ${JSON.stringify(error.details, null, 2)}`;
    }

    return output;
  }
}

let defaultHandler: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
  if (!defaultHandler) {
    defaultHandler = new ErrorHandler();
  }
  return defaultHandler;
}

export function resetErrorHandler(): void {
  defaultHandler = null;
}