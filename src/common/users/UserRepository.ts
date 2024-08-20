import { DynamoDB } from 'aws-sdk';
import { UserDAO } from './UserDAO';

export class UserRepository {
    private readonly tableName: string;
    private readonly dynamoDb: DynamoDB.DocumentClient;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.dynamoDb = new DynamoDB.DocumentClient();
    }

    public async createUser(user: UserDAO): Promise<void> {
        const params = {
            TableName: this.tableName,
            Item: user,
        };

        try {
            await this.dynamoDb.put(params).promise();
        } catch (error: any) {
            throw new Error(`Unable to create user: ${error.message}`);
        }
    }

    public async getUserByUsername(username: string): Promise<UserDAO | null> {
        const params = {
            TableName: this.tableName,
            IndexName: 'UsernameIndex',
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            }
        };

        try {
            const result = await this.dynamoDb.query(params).promise();
            if (result.Items && result.Items.length > 0) {
                const unmarshalledItem = DynamoDB.Converter.unmarshall(result.Items[0]);
                return {
                    userId: unmarshalledItem.userId as string,
                    username: unmarshalledItem.username as string,
                    email: unmarshalledItem.email as string,
                    createdAt: unmarshalledItem.createdAt as string,
                    updatedAt: unmarshalledItem.updatedAt as string,
                    lastLogin: unmarshalledItem.lastLogin as string | undefined,
                    passwordHash: unmarshalledItem.passwordHash as string,
                    isActive: unmarshalledItem.isActive as boolean,
                };
            } else {
                return null;
            }
        } catch (error: any) {
            throw new Error(`Unable to retrieve user by username: ${error.message}`);
        }
    }
}