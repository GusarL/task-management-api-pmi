import { APIGatewayTokenAuthorizerEvent, Context } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { jwtAuthorizer } from './authorizer';
import { getConfigSecrets } from '/opt/nodejs/utils/configSecrets';
import { createLogger } from '/opt/nodejs/utils/logger';

jest.mock('jsonwebtoken');
jest.mock('/opt/nodejs/utils/configSecrets');
jest.mock('/opt/nodejs/utils/logger');

describe('jwtAuthorizer', () => {
    let event: APIGatewayTokenAuthorizerEvent;
    let contextMock: Context
    const callbackMock = jest.fn()
    beforeEach(() => {
        (createLogger as jest.Mock).mockReturnValue({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        });

        event = {
            type: 'TOKEN',
            authorizationToken: 'Bearer testtoken',
            methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef1234/test/GET/request',
        } as APIGatewayTokenAuthorizerEvent;
        contextMock = {
            functionName: 'test',
            callbackWaitsForEmptyEventLoop: false
        } as unknown as Context
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should deny access when no token is provided', async () => {
        event.authorizationToken = '';

        const result = await jwtAuthorizer(event, contextMock, callbackMock);

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
        expect(result.principalId).toBe('unauthorized');
        expect(createLogger({ serviceName: 'Authorizer' }).warn).toHaveBeenCalledWith('no token is provided, deny access');
    });

    it('should deny access when token verification fails', async () => {
        (getConfigSecrets as jest.Mock).mockResolvedValue({ jwtSecret: 'secret' });
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const result = await jwtAuthorizer(event, contextMock, callbackMock);

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
        expect(result.principalId).toBe('unauthorized');
        expect(createLogger({ serviceName: 'Authorizer' }).error).toHaveBeenCalledWith('Token verification failed:', { error: 'Invalid token' });
    });

    it('should allow access when token is valid', async () => {
        const decodedToken = { sub: 'user123' };
        (getConfigSecrets as jest.Mock).mockResolvedValue({ jwtSecret: 'secret' });
        (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

        const result = await jwtAuthorizer(event, contextMock, callbackMock);

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.principalId).toBe('user123');
        expect(result.context).toEqual({ user: JSON.stringify(decodedToken) });
        expect(createLogger({ serviceName: 'Authorizer' }).info).toHaveBeenCalledWith('Allow access');
    });
});


