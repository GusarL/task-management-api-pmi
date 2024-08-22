import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { registerUserHandler } from './registration';
import { UserService } from '/opt/nodejs/users/userService';
import { Logger } from '/opt/nodejs/utils/interfaces';
import { UserDAO } from 'src/lambdas/common/users/userDAO'

jest.mock('/opt/nodejs/users/userService');
jest.mock('/opt/nodejs/utils/configSecrets');
jest.mock('/opt/nodejs/utils/logger');

const mockUserService = new UserService({} as any) as jest.Mocked<UserService>;
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
} as jest.Mocked<Logger>;

let contextMock: Context
const callbackMock = jest.fn()

beforeAll(() => {
    (require('/opt/nodejs/utils/logger').createLogger as jest.Mock).mockReturnValue(mockLogger);
    (require('/opt/nodejs/utils/configSecrets').getConfigSecrets as jest.Mock).mockResolvedValue({
        usersTableName: 'mockTableName',
    });
    (UserService as jest.Mock).mockReturnValue(mockUserService);
    contextMock = {
        functionName: 'test',
        callbackWaitsForEmptyEventLoop: false
    } as unknown as Context
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('registerUserHandler', () => {
    it('should successfully register a user', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify({
                username: 'testuser',
                password: 'Test@123',
                email: 'testuser@example.com',
            }),
        };

        mockUserService.getUserByUsername.mockResolvedValue(null); // No existing user
        mockUserService.createUser.mockResolvedValue({
            username: 'testuser',
            email: 'testuser@example.com',
        } as unknown as UserDAO);

        const response = await registerUserHandler(event as APIGatewayProxyEvent, contextMock, callbackMock);

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toEqual({
            username: 'testuser',
            email: 'testuser@example.com',
        });
        expect(mockUserService.getUserByUsername).toHaveBeenCalledWith('testuser');
        expect(mockUserService.createUser).toHaveBeenCalledWith('testuser', 'Test@123', 'testuser@example.com');
        expect(mockLogger.info).toHaveBeenCalledWith('User registered successfully', { username: 'testuser' });
    });

    it('should return 400 if validation fails', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify({
                username: 't',
                password: 'Test@123',
                email: 'invalid-email',
            }),
        };

        const response = await registerUserHandler(event as APIGatewayProxyEvent, contextMock, callbackMock);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).message).toContain('Invalid input');
        expect(mockLogger.warn).toHaveBeenCalledWith('Validation failed', expect.any(Object));
    });

    it('should return 409 if the user already exists', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify({
                username: 'testuser',
                password: 'Test@123',
                email: 'testuser@example.com',
            }),
        };

        mockUserService.getUserByUsername.mockResolvedValue({
            username: 'testuser',
            email: 'testuser@example.com',
        } as unknown as UserDAO);

        const response = await registerUserHandler(event as APIGatewayProxyEvent, contextMock, callbackMock);

        expect(response.statusCode).toBe(409);
        expect(JSON.parse(response.body).message).toBe('User already exists');
        expect(mockUserService.getUserByUsername).toHaveBeenCalledWith('testuser');
        expect(mockLogger.warn).toHaveBeenCalledWith('User already exists', { username: 'testuser' });
    });

    it('should return 500 on internal server error', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify({
                username: 'testuser',
                password: 'Test@123',
                email: 'testuser@example.com',
            }),
        };

        mockUserService.getUserByUsername.mockRejectedValue(new Error('DB connection failed'));

        const response = await registerUserHandler(event as APIGatewayProxyEvent, contextMock, callbackMock);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).message).toBe('Internal server error');
        expect(mockLogger.error).toHaveBeenCalledWith('Error registering user', { error: 'DB connection failed' });
    });
});