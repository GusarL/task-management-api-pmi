import { APIGatewayTokenAuthorizerEvent, Handler } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { CustomAPIGatewayAuthorizerResult } from './interfaces'
import { StatementEffect } from 'aws-lambda/trigger/api-gateway-authorizer'
import { getConfigSecrets } from '/opt/nodejs/utils/configSecrets'
import { Logger } from '/opt/nodejs/utils/interfaces'
import { createLogger } from '/opt/nodejs/utils/logger'

export const jwtAuthorizer: Handler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<CustomAPIGatewayAuthorizerResult> => {
    const logger: Logger = createLogger({ serviceName: 'Authorizer' });
    logger.info('Authorizer received request');
    const { jwtSecret } = await getConfigSecrets()
    const token = event.authorizationToken?.split(' ')[1];

    if (!token) {
        logger.warn('no token is provided, deny access');
        return generatePolicy('Deny', event.methodArn);
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        logger.info('Allow access');
        return generatePolicy('Allow', event.methodArn, decoded);
    } catch (err: any) {
        logger.error('Token verification failed:', { error: err.message });
        return generatePolicy('Deny', event.methodArn);
    }
};

// Function to generate a policy document
const generatePolicy = (effect: StatementEffect, resource: string, user?: any): CustomAPIGatewayAuthorizerResult => {
    const policy: CustomAPIGatewayAuthorizerResult = {
        principalId: user ? user.sub : 'unauthorized',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
    };

    if (user) {
        policy.context = {
            user: JSON.stringify(user),
        };
    }

    return policy;
};