import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TaskService } from './tasks/TaskService';
import { TaskRepository } from './tasks/TaskRepository';
// @ts-ignore
import { getConfigSecrets } from '/opt/common/utils/getConfigSecrets'
// @ts-ignore
import { createLogger } from '/opt/common//utils/logger'
// @ts-ignore
import { Logger } from '/opt/common/utils/interfaces'
import { createTaskSchema, taskIdSchema, updateTaskSchema } from './apiSchemas'

const logger: Logger = createLogger({ serviceName: 'TaskAPI' });

let taskService: TaskService;

const initialize = async () => {
    if (!taskService) {
        const config = await getConfigSecrets();
        const taskRepository = new TaskRepository(config.tasksTableName);
        taskService = new TaskService(taskRepository);
    }
};

export const apiHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await initialize();

    try {
        const httpMethod = event.httpMethod;
        const userId = event.requestContext.authorizer?.claims['cognito:username'] || '';

        switch (httpMethod) {
            case 'GET':
                return await handleGetTasks(userId);
            case 'POST':
                return await handleCreateTask(userId, event.body);
            case 'PUT':
                return await handleUpdateTask(event.pathParameters?.id!, event.body);
            case 'DELETE':
                return await handleDeleteTask(event.pathParameters?.id!);
            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ message: 'Method Not Allowed' }),
                };
        }
    } catch (error) {
        logger.error('Error processing request', { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};

const handleGetTasks = async (userId: string): Promise<APIGatewayProxyResult> => {
    const tasks = await taskService.getTasks(userId);
    return {
        statusCode: 200,
        body: JSON.stringify(tasks),
    };
};

const handleCreateTask = async (userId: string, body: string | null): Promise<APIGatewayProxyResult> => {
    const parsedBody = JSON.parse(body || '{}');
    const { error, value } = createTaskSchema.validate(parsedBody);

    if (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid request body', details: error.details }),
        };
    }

    const { title, description } = value;
    const task = await taskService.createTask(userId, title, description);
    return {
        statusCode: 201,
        body: JSON.stringify(task),
    };
};

const handleUpdateTask = async (taskId: string, body: string | null): Promise<APIGatewayProxyResult> => {
    const { error: taskIdError } = taskIdSchema.validate(taskId);

    if (taskIdError) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid taskId', details: taskIdError.details }),
        };
    }

    const parsedBody = JSON.parse(body || '{}');
    const { error, value } = updateTaskSchema.validate(parsedBody);

    if (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid request body', details: error.details }),
        };
    }

    const { title, description } = value;

    const task = await taskService.updateTask(taskId, title, description);
    return {
        statusCode: 200,
        body: JSON.stringify(task),
    };
};

const handleDeleteTask = async (taskId: string): Promise<APIGatewayProxyResult> => {
    const { error: taskIdError } = taskIdSchema.validate(taskId);

    if (taskIdError) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid taskId', details: taskIdError.details }),
        };
    }

    await taskService.deleteTask(taskId);
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Task deleted successfully' }),
    };
};