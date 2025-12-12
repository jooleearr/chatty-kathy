/**
 * Simple structured logger for the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogData {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, data?: LogData) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    }

    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level]

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${level.toUpperCase()}] ${message}`,
        data || ''
      )
    } else {
      // Structured JSON in production
      console[level === 'debug' ? 'log' : level](JSON.stringify(logEntry))
    }
  }

  debug(message: string, data?: LogData) {
    this.log('debug', message, data)
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data)
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error | unknown, data?: LogData) {
    const errorData = {
      ...data,
      ...(error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : { error }),
    }
    this.log('error', message, errorData)
  }
}

export const logger = new Logger()
