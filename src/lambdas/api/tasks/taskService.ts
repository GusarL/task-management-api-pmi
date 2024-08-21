import { TaskRepository } from './taskRepository';
import { v4 as uuidv4 } from 'uuid';
import { TaskDAO } from './taskDAO';

export class TaskService {
    private taskRepository: TaskRepository;

    constructor(taskRepository: TaskRepository) {
        this.taskRepository = taskRepository;
    }

    public async getTasks(userId: string): Promise<TaskDAO[] | null> {
        return this.taskRepository.getTasksByUserId(userId);
    }

    public async createTask(userId: string, title?: string, description?: string): Promise<TaskDAO> {
        const taskId = uuidv4();
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        const task: TaskDAO = {
            taskId,
            userId,
            ...(title && { title }),
            ...(description && { description }),
            createdAt,
            updatedAt
        };
        await this.taskRepository.createTask(task);
        return task;
    }

    public  async updateTask(taskId: string, userId: string, title?: string, description?: string): Promise<Partial<TaskDAO>> {
        const existingTask = await this.taskRepository.getTaskById(taskId);

        if (!existingTask || existingTask.userId !== userId) {
            throw new Error(`Task with ID ${taskId} not found for user ${userId}.`);
        }
        const updatedTask: Partial<TaskDAO> = {
            taskId: existingTask.taskId,
            userId: existingTask.userId,
            title: title ? title : existingTask.title,
            description: description ? description : existingTask.description,
            createdAt: existingTask.createdAt,
            updatedAt: new Date().toISOString()
        };
        await this.taskRepository.updateTask(updatedTask);

        return updatedTask;
    }

    public async deleteTask(taskId: string): Promise<{ taskId: string }> {
        await this.taskRepository.deleteTask(taskId);
        return { taskId };
    }
}