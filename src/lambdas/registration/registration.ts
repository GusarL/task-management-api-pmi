import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
// @ts-ignore
import { UserRepository } from '/opt/common/users/UserRepository';
// @ts-ignore
import { UserService } from '/opt/common/users/UserService';
import { RegisterUserRequestBody } from './interfaces'
import { userRegistrationSchema } from './registrationSchemas'
// @ts-ignore
import { getConfigSecrets } from '/opt/common/utils/getConfigSecrets'
// @ts-ignore
import { Logger } from '/opt/common/utils/interfaces'
// @ts-ignore
import { createLogger } from '/opt/common//utils/logger'
const logger: Logger = createLogger({ serviceName: 'UserRegistrationService' });

let userService: UserService;

const initialize = async () => {
    if (!userService) {
        const { usersTableName } = await getConfigSecrets()
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
            logger.warn('Validation failed', { validationError: error.message });
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Invalid input: ${error.message}` }),
            };
        }

        const { username, password, email } = value;

        // Check if the user already exists
        const existingUser = await userService.getUserByUsername(username);
        if (existingUser) {
            logger.warn('User already exists', { username });
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'User already exists' }),
            };
        }

        // Register the new user
        const newUser = await userService.createUser(username, password, email);

        logger.info('User registered successfully', { username: newUser.username });

        return {
            statusCode: 201,
            body: JSON.stringify(newUser),
        };
    } catch (error: any) {
        logger.error('Error registering user', { error: error.message });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};