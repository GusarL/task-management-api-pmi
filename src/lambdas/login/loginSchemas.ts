import * as Joi from 'joi';

export const userLoginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
});