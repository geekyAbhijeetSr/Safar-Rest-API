const jwt = require('jsonwebtoken')
const HttpError = require('../error/http-error')

exports.generateToken = async function (payload, secretKey, tokenAge = '1h') {
	const token = await jwt.sign(
		payload,
		secretKey,
		{ expiresIn: tokenAge }
	)
	return token
}

exports.verifyToken = async (req, res, next) => {
	try {
		const token = req.cookies.jwt

		if (!token) {
			const error = new HttpError('Authentication failed!', 401)
			return next(error)
		}
		const decodedToken = await jwt.verify(token, process.env.JWT_SECRET)
		req.tokenPayload = { userId: decodedToken.userId }
		next()
	} catch (err) {
		res.clearCookie('jwt')
		if (err instanceof jwt.JsonWebTokenError) {
			const error = new HttpError('Authentication failed!', 401)
			return next(error)
		}
		const error = new HttpError()
		next(error)
	}
}
