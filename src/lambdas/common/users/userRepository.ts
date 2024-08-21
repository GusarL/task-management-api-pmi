import { DynamoDB } from 'aws-sdk';
import { UserDAO } from './userDAO';

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
            const user = await this.dynamoDb.query(params).promise();
            if (user.Items && user.Items.length > 0) {
                return user.Items[0] as unknown as UserDAO;
            } else {
                return null;
            }
        } catch (error: any) {
            throw new Error(`Unable to retrieve user by username: ${error.message}`);
        }
    }
}