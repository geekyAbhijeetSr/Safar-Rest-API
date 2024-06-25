const errorHandler = (error, req, res, next) => {
	if (res.headerSent) return next(error)

	const { message = 'Internal Server Error', statusCode = 500 } = error

	// Check if message is an array and extract first error
	const errorMessage = Array.isArray(message) ? message[0].msg : message

	// Send JSON response with error message and ok status
	res.status(statusCode).json({
		errorMsg: errorMessage,
		ok: false,
	})
}

module.exports = errorHandler
