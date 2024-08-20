import { DynamoDB } from 'aws-sdk';
import { TaskDAO } from './TaskDAO';
// @ts-ignore
import { createLogger } from '/opt/nodejs/common//utils/logger'
// @ts-ignore
import { Logger } from '/opt/nodejs/common/utils/interfaces'

export class TaskRepository {
    private readonly tableName: string;
    private readonly dynamoDb: DynamoDB.DocumentClient;
    private readonly logger: Logger;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.dynamoDb = new DynamoDB.DocumentClient();
        this.logger = createLogger({ serviceName: 'TaskRepository' });
    }

    public async getTasksByUserId(userId: string): Promise<TaskDAO[] | null> {
        const params = {
            TableName: this.tableName,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };

        try {
            const tasks = await this.dynamoDb.query(params).promise();
            if (tasks.Items && tasks.Items.length > 0) {
                return tasks.Items.map(item => {
                    const unmarshalledItem = DynamoDB.Converter.unmarshall(item)
                    return {
                        taskId: unmarshalledItem.taskId as string,
                        title: unmarshalledItem.title as string,
                        userId: unmarshalledItem.userId as string,
                        description: unmarshalledItem.description as string | undefined,
                        createdAt: unmarshalledItem.createdAt as string,
                        updatedAt: unmarshalledItem.updatedAt as string
                    }
                });
            } else {
                return null;
            }
        } catch (error: any) {
            this.logger.error('Unable to query tasks:', { error: error.message });
            throw new Error(`Unable to query tasks: ${error.message}`);
        }
    }

    public async getTaskById(taskId: string): Promise<TaskDAO | null> {
        const params = {
            TableName: this.tableName,
            Key: { taskId }
        };

        try {
            const result = await this.dynamoDb.get(params).promise();
            if (result.Item) {
                const unmarshalledItem = DynamoDB.Converter.unmarshall(result.Item);
                return {
                    taskId: unmarshalledItem.taskId as string,
                    userId: unmarshalledItem.userId as string,
                    title: unmarshalledItem.title as string,
                    description: unmarshalledItem.description as string | undefined,
                    createdAt: unmarshalledItem.createdAt as string,
                    updatedAt: unmarshalledItem.updatedAt as string
                };
            } else {
                return null;
            }
        } catch (error: any) {
            this.logger.error('Unable to get task by ID:', { error: error.message });
            throw new Error(`Unable to get task by ID: ${error.message}`);
        }
    }

    public async createTask(task: TaskDAO): Promise<void> {
        const params = {
            TableName: this.tableName,
            Item: task,
        };

        try {
            await this.dynamoDb.put(params).promise();
        } catch (error: any) {
            this.logger.error('Unable to create task', { error: error.message });
            throw new Error(`Unable to create task: ${error.message}`);
        }
    }

    public async updateTask(task: Partial<TaskDAO>): Promise<void> {
        const { taskId, userId, title, description } = task;

        if (!taskId || !userId) {
            throw new Error('Both taskId and userId are required to update a task.');
        }

        const updatedAt = new Date().toISOString();

        const updateExpressions = [];
        const expressionAttributeValues: { [key: string]: any } = {
            ':updatedAt': updatedAt
        };

        if (title !== undefined) {
            updateExpressions.push('title = :title');
            expressionAttributeValues[':title'] = title;
        }

        if (description !== undefined) {
            updateExpressions.push('description = :description');
            expressionAttributeValues[':description'] = description;
        }

        updateExpressions.push('updatedAt = :updatedAt');

        const updateExpression = 'SET ' + updateExpressions.join(', ');

        try {
            await this.dynamoDb.update({
                TableName: this.tableName,
                Key: { userId, taskId },
                UpdateExpression: updateExpression,
                ExpressionAttributeValues: expressionAttributeValues,
                ConditionExpression: 'attribute_exists(taskId) AND attribute_exists(userId)'
            }).promise();
        } catch (error: any) {
            this.logger.error('Error updating task:', { error: error.message });
            throw new Error('Failed to update task.');
        }
    }
    public async deleteTask(taskId: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: { taskId }
        };

        try {
            await this.dynamoDb.delete(params).promise();
        } catch (error: any) {
            this.logger.error('Unable delete task:', { error: error.message });
            throw new Error(`Unable delete task: ${error.message}`);
        }
    }
}