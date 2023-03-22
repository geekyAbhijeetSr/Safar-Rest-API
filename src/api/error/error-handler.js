const errorHandler = (error, req, res, next) => {
	if (res.headerSent) return next(error)
	const { message = 'Internal Server Error', statusCode = 500 } = error

	res.status(statusCode).json({
		errorMsg: Array.isArray(message) ? message[0].msg : message,
		ok: false
	})
}

module.exports = errorHandler
