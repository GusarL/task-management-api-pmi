import { APIGatewayAuthorizerResult } from 'aws-lambda'

export interface CustomAPIGatewayAuthorizerResult extends APIGatewayAuthorizerResult {
    context?: {
        [key: string]: string;
    };
}