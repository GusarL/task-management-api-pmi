import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import bcrypt from 'bcrypt';
import { UserService } from '/opt/nodejs/users/userService';
import { getConfigSecrets } from '/opt/nodejs/utils/configSecrets';
import jwt from 'jsonwebtoken';
import { loginHandler } from './login';
import { Logger } from 'src/lambdas/common/utils/interfaces'

jest.mock('bcrypt');
jest.mock('/opt/nodejs/users/userService');
jest.mock('/opt/nodejs/utils/configSecrets');
jest.mock('jsonwebtoken');
jest.mock('/opt/nodejs/utils/logger');

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
} as jest.Mocked<Logger>;

describe('loginHandler', () => {
    let event: APIGatewayProxyEvent;
    let contextMock: Context
    const callbackMock = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks();
        (require('/opt/nodejs/utils/logger').createLogger as jest.Mock).mockReturnValue(mockLogger);
        event = {
            body: JSON.stringify({ username: 'testuser', password: 'testpass' }),
        } as any;

        contextMock = {
            functionName: 'test',
            callbackWaitsForEmptyEventLoop: false
        } as unknown as Context
    });

    it('should return 200 and a token on successful login', async () => {
        const mockUser = { userId: '123', username: 'testuser', passwordHash: 'hashedPassword' };
        const mockToken = 'mockJwtToken';

        (getConfigSecrets as jest.Mock).mockResolvedValue({ jwtSecret: 'secret', usersTableName: 'UsersTable' });
        (UserService.prototype.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue(mockToken);

        const result: APIGatewayProxyResult = await loginHandler(event, contextMock, callbackMock);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ token: mockToken });
        expect(UserService.prototype.getUserByUsername).toHaveBeenCalledWith('testuser');
        expect(bcrypt.compare).toHaveBeenCalledWith('testpass', 'hashedPassword');
        expect(jwt.sign).toHaveBeenCalledWith({ userId: '123' }, 'secret', { expiresIn: '1h' });
    });

    it('should return 400 if validation fails', async () => {
        event.body = JSON.stringify({ username: '' }); // Invalid input

        const result: APIGatewayProxyResult = await loginHandler(event, contextMock, callbackMock);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toMatch(/Invalid input:/);
    });

    it('should return 401 if credentials are invalid', async () => {
        const mockUser = { userId: '123', username: 'testuser', passwordHash: 'hashedPassword' };

        (getConfigSecrets as jest.Mock).mockResolvedValue({ jwtSecret: 'secret', usersTableName: 'UsersTable' });
        (UserService.prototype.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const result: APIGatewayProxyResult = await loginHandler(event, contextMock, callbackMock);

        expect(result.statusCode).toBe(401);
        expect(JSON.parse(result.body)).toEqual({ message: 'Invalid credentials' });
    });

    it('should return 500 if config secrets retrieval fails', async () => {
        (getConfigSecrets as jest.Mock).mockResolvedValue({ jwtSecret: null, usersTableName: null });

        const result: APIGatewayProxyResult = await loginHandler(event, contextMock, callbackMock);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({ message: 'Internal server error' });
    });

    it('should return 500 on internal server error', async () => {
        (getConfigSecrets as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

        const result: APIGatewayProxyResult = await loginHandler(event, contextMock, callbackMock);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({ message: 'Internal server error' });
    });
});
