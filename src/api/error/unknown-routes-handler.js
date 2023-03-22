const HttpError = require('./http-error')

const unknownRoutesHandler = (req, res, next) => {
	const error = new HttpError('Could not find this route', 404)
	throw error
}

module.exports = unknownRoutesHandler
