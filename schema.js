
const joi = require("joi");

module.exports.PlantSchema = joi.object({
    listing: joi.object({
        name: joi.string().required(),
        // imageUrl: joi.string().allow("", null),
        category: joi.string().required(),
        price: joi.number().required().min(0),
        description: joi.string().required(),
        quantity: joi.number().required().min(0)
    }).required()
});

module.exports.userSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required().min(6),
    mobno: joi.number().required().min(1000000000).max(9999999999),
    confirmPassword: joi.string().valid(joi.ref('password')).required()
        .messages({'any.only': 'Passwords must match'})
});