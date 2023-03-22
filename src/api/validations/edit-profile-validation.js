const { body } = require('express-validator')

exports.editProfileValidation = [
	body('username').notEmpty().withMessage('Username is required'),
	body('name').notEmpty().withMessage('Name is required'),
	body('email').isEmail().withMessage('Email is invalid'),
]
