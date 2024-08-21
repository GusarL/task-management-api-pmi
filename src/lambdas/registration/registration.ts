import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
// @ts-ignore
import { UserRepository } from '/opt/nodejs/users/userRepository';
// @ts-ignore
import { UserService } from '/opt/nodejs/users/userService';
import { RegisterUserRequestBody } from './interfaces'
import { userRegistrationSchema } from './registrationSchemas'
// @ts-ignore
import { getConfigSecrets } from '/opt/nodejs/utils/configSecrets'
// @ts-ignore
import { Logger } from '/opt/nodejs/utils/interfaces'
// @ts-ignore
import { createLogger } from '/opt/nodejs/utils/logger'

const logger: Logger = createLogger({ serviceName: 'UserRegistrationService' });

let userService: UserService;

const initialize = async () => {
    if (!userService) {
        const { usersTableName } = await getConfigSecrets();
        const userRepository = new UserRepository(usersTableName);
        userService = new UserService(userRepository);
    }
};

export const registerUserHandler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Received request to register user', { userName: event?.body ? JSON.parse(event.body).username : undefined });
    await initialize();

    try {
        const requestBody: RegisterUserRequestBody = JSON.parse(event.body || '{}');

        // Validate the input
        const { error, value } = userRegistrationSchema.validate(requestBody);
        if (error) {
            throw new Error(`Invalid input: ${error.message}`);
        }

        const { username, password, email } = value;

        // Check if the user already exists
        const existingUser = await userService.getUserByUsername(username);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Register the new user
        const newUser = await userService.createUser(username, password, email);

        logger.info('User registered successfully', { username: newUser.username });

        return {
            statusCode: 201,
            body: JSON.stringify(newUser),
        };
    } catch (error: any) {
        if (error.message.startsWith('Invalid input')) {
            logger.warn('Validation failed', { validationError: error.message });
            return {
                statusCode: 400,
                body: JSON.stringify({ message: error.message }),
            };
        }

        if (error.message === 'User already exists') {
            logger.warn('User already exists', { username: event?.body ? JSON.parse(event.body).username : undefined });
            return {
                statusCode: 409,
                body: JSON.stringify({ message: error.message }),
            };
        }

        logger.error('Error registering user', { error: error.message });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};