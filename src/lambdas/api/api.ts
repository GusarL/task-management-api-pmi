import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TaskService } from './tasks/taskService';
import { TaskRepository } from './tasks/taskRepository';
import { getConfigSecrets } from '/opt/nodejs/utils/configSecrets'
import { createLogger } from '/opt/nodejs/utils/logger'
import { Logger } from '/opt/nodejs/utils/interfaces'
import { createTaskSchema, taskIdSchema, updateTaskSchema } from './apiSchemas'
import { CreateTaskRequestBody } from './tasks/interfaces'

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
    logger.info('Task API request received');
    await initialize();

    try {
        const httpMethod = event.httpMethod;
        const parsedUser = JSON.parse(event?.requestContext?.authorizer?.user ?? '')
        const userId = parsedUser ? parsedUser.userId : undefined;

        switch (httpMethod) {
            case 'GET':
                return await handleGetTasks(userId);
            case 'POST':
                return await handleCreateTask(userId, event.body);
            case 'PUT':
                return await handleUpdateTask(event.pathParameters?.id!, userId, event.body);
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
    const parsedBody: CreateTaskRequestBody = JSON.parse(body || '{}');
    const { error, value } = createTaskSchema.validate({...parsedBody, userId});
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

const handleUpdateTask = async (taskId: string, userId: string, body: string | null): Promise<APIGatewayProxyResult> => {
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