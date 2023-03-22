const User = require('../models/user-model')
const HttpError = require('../error/http-error')
const { generateToken } = require('../middleware/authentication')
const jwt = require('jsonwebtoken')
const { checkIfEmail, placeHolderAvatar } = require('../helper/utils')
const mailTransporter = require('../../config/mailTransporter')

const TokenAge = 30 * 24 * 60 * 60 * 1000

exports.signup = async (req, res, next) => {
	try {
		let { username, name, email, password } = req.body
		email = email.toLowerCase()

		const [EmailInUse, UsernameInUse] = await Promise.all([
			User.findOne({ email }),
			User.findOne({
				username: { $regex: new RegExp('^' + username + '$', 'i') },
			}),
		])

		if (UsernameInUse) {
			const error = new HttpError('Username already taken', 422)
			return next(error)
		}

		if (EmailInUse) {
			const error = new HttpError('Email already in use', 422)
			return next(error)
		}

		const newUserObj = {
			username,
			avatar: {
				image: placeHolderAvatar(),
			},
			banner: {
				image:
					'https://res.cloudinary.com/cloudinary-v3/image/upload/v1675240154/Assets/tree_vdmy50.jpg',
			},
			name,
			email,
			password,
		}

		const user = new User(newUserObj)

		await user.save()

		const user_ = {
			_id: user._id,
			name: user.name,
			username: user.username,
			avatar: user.avatar,
			banner: user.banner,
			bio: user.bio,
			email: user.email
		}
		user_.avatar.imageId = undefined
		user_.banner.imageId = undefined

		const token = await generateToken(
			{
				userId: user._id,
			},
			process.env.JWT_SECRET,
			TokenAge.toString() + 'ms'
		)

		res
			.status(201)
			.cookie('jwt', token, {
				httpOnly: true,
				sameSite: 'strict',
				maxAge: TokenAge,
			})
			.json({
				msg: 'Registered successfully',
				user: user_,
				exp: new Date().getTime() + TokenAge,
				ok: true,
			})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.login = async (req, res, next) => {
	try {
		const { username_or_email, password } = req.body

		const isEmail = checkIfEmail(username_or_email)

		let user
		if (isEmail) {
			user = await User.findOne({
				email: username_or_email.toLowerCase(),
			}).select('password _id name username avatar banner bio email')
		} else {
			user = await User.findOne({
				username: { $regex: new RegExp('^' + username_or_email + '$', 'i') },
			}).select('password _id name username avatar banner bio email')
		}

		if (!user) {
			const error = new HttpError('Invalid credentials', 401)
			return next(error)
		}

		const samePassword = await user.comparePassword(password)
		if (!samePassword) {
			const error = new HttpError('Invalid credentials', 401)
			return next(error)
		}

		const token = await generateToken(
			{
				userId: user._id,
			},
			process.env.JWT_SECRET,
			TokenAge.toString() + 'ms'
		)

		user.password = undefined
		user.avatar.imageId = undefined
		user.banner.imageId = undefined

		res
			.status(200)
			.cookie('jwt', token, {
				httpOnly: true,
				sameSite: 'none',
				maxAge: TokenAge,
			})
			.json({
				msg: 'Logged in successfully',
				user,
				exp: new Date().getTime() + TokenAge,
				ok: true,
			})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.logout = async (req, res, next) => {
	try {
		res.clearCookie('jwt')
		res.status(200).json({ message: 'Logged out successfully' })
	} catch (err) {
		const error = new HttpError()
		return next(error)
	}
}

exports.renewToken = async (req, res, next) => {
	try {
		const { userId } = req.tokenPayload
		const { usrId } = req.params

		if (userId !== usrId) {
			const error = new HttpError()
			return next(error)
		}

		const user = await User.findById(userId)

		if (!user) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		const token = await generateToken(
			{
				userId: user._id,
			},
			process.env.JWT_SECRET,
			TokenAge.toString() + 'ms'
		)

		res
			.status(200)
			.cookie('jwt', token, {
				httpOnly: true,
				sameSite: 'strict',
				maxAge: TokenAge,
			})
			.json({
				msg: 'Token renewed successfully',
				exp: new Date().getTime() + TokenAge,
				ok: true,
			})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.changePassword = async (req, res, next) => {
	try {
		const { userId } = req.tokenPayload
		const { old_password, new_password } = req.body
		const user = await User.findById(userId).select('+password')

		if (!user) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		const samePassword = await user.comparePassword(old_password)
		if (!samePassword) {
			const error = new HttpError('Incorrect old password', 401)
			return next(error)
		}

		user.password = new_password

		await user.save()

		res.json({
			message: 'Changed password successfully',
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

let alreadyUsedToken = []

function removeUsedToken() {
	alreadyUsedToken = alreadyUsedToken.filter(token => !isTokenExpired(token))
}

function isTokenExpired(token) {
	const decodedToken = jwt.decode(token, { complete: true })
	const expirationTime = decodedToken.payload.exp
	const currentTime = Date.now() / 1000 // convert to seconds
	return currentTime > expirationTime
}

exports.forgotPassword = async (req, res, next) => {
	try {
		removeUsedToken()
		const { email } = req.body

		const user = await User.findOne({ email: email })

		if (!user) {
			const error = new HttpError('Email not found in our record!', 404)
			return next(error)
		}

		const token = await generateToken(
			{
				userId: user._id,
			},
			process.env.JWT_SECRET,
			'10m'
		)

		const url = `http://localhost:3000/reset-password?token=${token}`

		let mailOptions = {
			from: 'nor666108.com',
			to: email,
			subject: 'Safar Password Reset Link',
			text: `Click the following link to reset your password.\nNote: Link is valid for 10 minutes. \n\n${url}`,
		}

		mailTransporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error)
				const error = new HttpError()
				return next(error)
			} else {
				console.log('Email sent: ' + info.response)
				res.json({ message: 'Email sent!', ok: true })
			}
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.verifyTokenForResetPass = async (req, res, next) => {
	try {
		removeUsedToken()
		const { token } = req.params

		if (!token) {
			const error = new HttpError('Token is required!', 401)
			return next(error)
		}

		if (alreadyUsedToken.includes(token)) {
			const error = new HttpError('Link already used!', 400)
			return next(error)
		}

		await jwt.verify(token, process.env.JWT_SECRET)

		res.json({
			message: 'Verified successfully!',
			ok: true,
		})
	} catch (err) {
		if (err instanceof jwt.JsonWebTokenError) {
			const error = new HttpError('Invalid token!')
			return next(error)
		}
		const error = new HttpError()
		return next(error)
	}
}

exports.resetPassword = async (req, res, next) => {
	try {
		removeUsedToken()
		const { token } = req.params
		const { new_password } = req.body

		if (!token) {
			const error = new HttpError('Token is required!', 401)
			return next(error)
		}

		if (alreadyUsedToken.includes(token)) {
			const error = new HttpError('Link already used!', 400)
			return next(error)
		}

		const { userId } = await jwt.verify(token, process.env.JWT_SECRET)

		const foundUser = await User.findById(userId).select('+password')

		if (!foundUser) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		foundUser.password = new_password

		await foundUser.save()

		alreadyUsedToken.push(token)

		res.json({
			message: 'Password changed successfully!',
			ok: true,
		})
	} catch (err) {
		if (err instanceof jwt.JsonWebTokenError) {
			const error = new HttpError('Invalid token!')
			return next(error)
		}
		const error = new HttpError()
		return next(error)
	}
}
