import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import bcrypt from 'bcrypt';
import { UserService } from '/opt/nodejs/users/userService';
import { createLogger } from '/opt/nodejs/utils/logger'
import { getConfigSecrets } from '/opt/nodejs/utils/configSecrets'
import jwt from 'jsonwebtoken';
import { UserRepository } from '/opt/nodejs/users/userRepository';
import { LoginUserRequestBody } from './interfaces'
import { userLoginSchema } from './loginSchemas'

export const loginHandler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const logger = createLogger({ serviceName: 'LoginService' });
    logger.info('Login attempt received');

    try {
        const requestBody: LoginUserRequestBody = JSON.parse(event.body || '{}');

        // Validate the input
        const { error, value } = userLoginSchema.validate(requestBody);
        if (error) {
            logger.warn('Validation failed', { validationError: error.message });
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Invalid input: ${error.message}` }),
            };
        }

        const { username, password } = value;

        const { jwtSecret, usersTableName } = await getConfigSecrets();
        if (!jwtSecret || !usersTableName) {
            logger.error('Failed to retrieve configuration secrets');
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Internal server error' })
            };
        }

        const userRepository = new UserRepository(usersTableName);
        const userService = new UserService(userRepository);

        const user = await userService.getUserByUsername(username);

        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const token = jwt.sign({ userId: user.userId }, jwtSecret, { expiresIn: '1h' });
            logger.info('User successfully authenticated', { userId: user.userId });
            return {
                statusCode: 200,
                body: JSON.stringify({ token })
            };
        } else {
            logger.warn('Invalid credentials provided', { username });
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid credentials' })
            };
        }

    } catch (error: any) {
        logger.error('Error occurred during login', { error: error.message });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};