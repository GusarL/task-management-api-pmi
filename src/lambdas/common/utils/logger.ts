import { Logger, LoggerOptions } from './interfaces'

export const createLogger = (options: LoggerOptions): Logger => {
    const { serviceName } = options;

    const log = (level: string, message: string, metadata: Record<string, any> = {}) => {
        const logEntry = {
            level,
            serviceName,
            message,
            metadata,
            timestamp: new Date().toISOString(),
        };
        console.log(JSON.stringify(logEntry));
    };

    return {
        info: (message: string, metadata?: Record<string, any>) => log('info', message, metadata),
        warn: (message: string, metadata?: Record<string, any>) => log('warn', message, metadata),
        error: (message: string, metadata?: Record<string, any>) => log('error', message, metadata),
    };
};