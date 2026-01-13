// 日志系统

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

export class Logger {
  private entries: LogEntry[] = [];
  private minLevel: LogLevel = LogLevel.INFO;
  private maxEntries: number = 1000;

  constructor(minLevel?: LogLevel) {
    if (minLevel !== undefined) {
      this.minLevel = minLevel;
    }
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
    };

    this.entries.push(entry);

    // 限制日志数量
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // 输出到控制台
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();

    let output = `[${timestamp}] [${levelName}] ${entry.message}`;

    if (entry.context) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output);
        break;
    }
  }

  getEntries(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.entries.filter(e => e.level === level);
    }
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  export(): string {
    return this.entries
      .map(entry => {
        const levelName = LogLevel[entry.level];
        const timestamp = entry.timestamp.toISOString();
        let output = `[${timestamp}] [${levelName}] ${entry.message}`;

        if (entry.context) {
          output += ` ${JSON.stringify(entry.context)}`;
        }

        return output;
      })
      .join('\n');
  }
}

let defaultLogger: Logger | null = null;

export function getLogger(minLevel?: LogLevel): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger(minLevel);
  }
  return defaultLogger;
}

export function resetLogger(): void {
  defaultLogger = null;
}