const { validationResult } = require('express-validator')
const HttpError = require('../error/http-error')

const validate = (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const error = new HttpError(errors.array(), 422)
		next(error)
	}
	next()
}

module.exports = validate
