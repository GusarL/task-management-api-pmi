import { SecretsManager } from 'aws-sdk';
import { Logger, Secrets } from './interfaces'
import { createLogger } from './logger'

const secretsManager = new SecretsManager();
let cachedSecret: Secrets | null = null;

export const getConfigSecrets = async () => {
    const logger: Logger = createLogger({ serviceName: 'ConfigSecrets' });
    logger.info('Retrieving secrets');
    if (cachedSecret) {
        return {
            jwtSecret: cachedSecret.JWT_SECRET,
            usersTableName: cachedSecret.DYNAMODB_USERS_TABLE,
            tasksTableName: cachedSecret.DYNAMODB_TASKS_TABLE
        }
    }
    try {
        const secretArn = process.env.SECRET_ARN!;
        const secret = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
        if ('SecretString' in secret) {
            const parsedSecret = JSON.parse(secret.SecretString!)  as Secrets;
            if (parsedSecret) {
                cachedSecret = parsedSecret;
                return {
                    jwtSecret: cachedSecret.JWT_SECRET,
                    usersTableName: cachedSecret.DYNAMODB_USERS_TABLE,
                    tasksTableName: cachedSecret.DYNAMODB_TASKS_TABLE
                };
            } else {
                logger.error('Failed to parse secret');
                throw new Error('Failed to parse secret');
            }
        } else {
            logger.error('SecretString not found in secret');
            throw new Error('SecretString not found in secret');
        }
    } catch (err: any) {
        logger.error('Error retrieving secret from Secrets Manager:', { error: err.message });
        throw new Error('Failed to retrieve secret');
    }
}