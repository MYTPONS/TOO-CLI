// 日志和错误类型定义

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

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}