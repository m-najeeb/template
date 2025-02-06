const Joi = require('joi');
const constants = require('../utilities/constants');
class userValidation {
    async signUp(userData) {
        const schema = Joi.object({
            fullName: Joi.string().max(55).required(),
            username: Joi.string().max(55).required(),
            email: Joi.string().email().required(),
            phone: Joi.string().length(11).required(),
            password: Joi.string().regex(constants.PASSWORD.REGEX)
                .required()
                .messages({
                    'string.pattern.base': constants.PASSWORD.MESSAGE_FORMAT
                }),
            profilePicture: Joi.string().uri().optional(),
            country: Joi.string().optional(),
            role: Joi.number().valid(0, 1).required(),
        });
       return schema.validate(userData);
    }

    async signIn(userData) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        });
       return schema.validate(userData);
    }

    async editBasicProfile(userData) {
        const schema = Joi.object({
            id: Joi.string().required(),
            fullName: Joi.string().optional(),
            idExpiryDate: Joi.string().optional(),
            profilePicture: Joi.string().uri().optional(),
        });
       return schema.validate(userData);
    }
}

// Export an instance of the class to use its methods
module.exports = new userValidation();
