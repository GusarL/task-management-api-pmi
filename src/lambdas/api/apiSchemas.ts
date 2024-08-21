import * as Joi from 'joi';

export const createTaskSchema = Joi.object({
    userId: Joi.string().required(),
    title: Joi.string().optional(),
    description: Joi.string().optional(),
});

export const updateTaskSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
});

export const taskIdSchema = Joi.string().uuid().required();