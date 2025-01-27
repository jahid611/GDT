import Joi from "joi"

export const validateRegisterInput = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  })
  return schema.validate(data)
}

export const validateLoginInput = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  })
  return schema.validate(data)
}

export const validateTaskInput = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    status: Joi.string().valid("todo", "in_progress", "review", "done"),
    priority: Joi.string().valid("low", "medium", "high"),
    assignedTo: Joi.string(),
    team: Joi.string(),
    dueDate: Joi.date(),
    tags: Joi.array().items(Joi.string()),
  })
  return schema.validate(data)
}

