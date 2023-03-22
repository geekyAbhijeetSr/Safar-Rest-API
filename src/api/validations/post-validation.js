const { body } = require('express-validator')

exports.postValidation = [
	body('location').notEmpty().withMessage('Location is required'),
	body('caption').notEmpty().withMessage('Caption is required'),
]
