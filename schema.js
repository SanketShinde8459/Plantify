const Joi = require("joi");  // Changed to uppercase Joi

module.exports.PlantSchema = Joi.object({
    listing: Joi.object({
        name: Joi.string().required(),
        imageUrl: Joi.string().allow("", null),
        category: Joi.string().required(),
        price: Joi.number().required().min(0),
        description: Joi.string().required(),
        quantity: Joi.number().required().min(0)
    }).required()
});

module.exports.userSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    mobno: Joi.number().required().min(1000000000).max(9999999999),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
        .messages({'any.only': 'Passwords must match'})
});