const { body } = require('express-validator')

exports.signupValidation = [
	body('username').notEmpty().withMessage('Username is required'),
	body('name').notEmpty().withMessage('Name is required'),
	body('email').isEmail().withMessage('Email is invalid'),
	body('password')
		.notEmpty()
		.withMessage('Password is required')
		.isLength({ min: 8 })
		.withMessage('Password must be at least 8 characters long'),
]

exports.loginValidation = [
	body('username_or_email')
		.notEmpty()
		.withMessage('Username or Email is required'),
	body('password').notEmpty().withMessage('Password is required'),
]

exports.changePassValidation = [
	body('old_password').notEmpty().withMessage('Old password is required'),
	body('new_password')
		.notEmpty()
		.withMessage('New password is required')
		.isLength({ min: 8 })
		.withMessage('New password must be at least 8 characters long'),
]

exports.forgotPassValidation = [
	body('email').isEmail().withMessage('Email is invalid'),
]

exports.resetPassValidation = [
	body('new_password')
		.notEmpty()
		.withMessage('New password is required')
		.isLength({ min: 8 })
		.withMessage('New password must be at least 8 characters long'),
]

