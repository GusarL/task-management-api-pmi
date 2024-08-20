export interface Logger {
    info(message: string, metadata?: Record<string, any>): void;
    warn(message: string, metadata?: Record<string, any>): void;
    error(message: string, metadata?: Record<string, any>): void;
}

export interface LoggerOptions {
    serviceName: string;
}

export interface Secrets {
    DYNAMODB_USERS_TABLE: string;
    DYNAMODB_TASKS_TABLE: string;
    JWT_SECRET: string;
}