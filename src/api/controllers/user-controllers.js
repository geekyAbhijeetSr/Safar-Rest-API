const HttpError = require('../error/http-error')
const {
	uploadToCloudinary,
	compressImage,
	deleteFromCloudinary,
} = require('../../config/cloudinaryConfig')
const User = require('../models/user-model')
const { paginatedResponse } = require('../middleware/pagination')

exports.getUser = async (req, res, next) => {
	try {
		const { username } = req.params

		const user = await User.findOne({
			username: { $regex: new RegExp('^' + username + '$', 'i') },
		}).select('_id name username avatar banner bio followers noOfFollowers noOfFollowing noOfPosts')

		if (!user) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		res.json({
			user,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.follow = async (req, res, next) => {
	try {
		const { userId: Id } = req.tokenPayload
		const { userId } = req.params

		if (Id === userId) {
			const error = new HttpError('This action is not allowed!', 500)
			return next(error)
		}

		let [currentUser, user] = await Promise.all([
			User.findById(Id),
			User.findById(userId),
		])

		if (currentUser && user) {
			if (currentUser.following.includes(user._id)) {
				const error = new HttpError('Already following', 500)
				return next(error)
			}
			user.followers.push(currentUser._id)
			user.noOfFollowers++
			currentUser.following.push(user._id)
			currentUser.noOfFollowing++
			;[currentUser, user] = await Promise.all([currentUser.save(), user.save()])
		} else {
			const error = new HttpError('Something went wrong', 500)
			return next(error)
		}

		res.status(200).json({
			user: currentUser,
			following: user,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.unfollow = async (req, res, next) => {
	try {
		const { userId: Id } = req.tokenPayload
		const { userId } = req.params

		if (Id === userId) {
			const error = new HttpError("This action is not allowed!", 500)
			return next(error)
		}

		let [currentUser, user] = await Promise.all([
			User.findById(Id),
			User.findById(userId),
		])

		if (currentUser && user) {
			if (!currentUser.following.includes(user._id)) {
				const error = new HttpError('Not following', 500)
				return next(error)
			}

			const index1 = user.followers.findIndex(f => f._id === currentUser._id)
			user.followers.splice(index1, 1)
			user.noOfFollowers--

			const index2 = currentUser.following.findIndex(f => f._id === user._id)
			currentUser.following.splice(index2, 1)
			currentUser.noOfFollowing--
			;[currentUser, user] = await Promise.all([currentUser.save(), user.save()])
		} else {
			const error = new HttpError('Something went wrong', 500)
			return next(error)
		}

		res.status(200).json({
			user: currentUser,
			unfollowing: user,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.editUser = async (req, res, next) => {
	try {
		const { userId } = req.params
		const { username, name, email, bio } = req.body

		if (userId === process.env.DEMO_USER_ID) {
			const error = new HttpError(`Action is not allowed!`, 500)
			return next(error)
		}

		const user = await User.findById(userId)

		if (!user) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		if (user.username !== username) {
			user.username = username
		}

		if (user.name !== name) {
			user.name = name
		}

		if (user.email !== email) {
			user.email = email
		}

		if (bio) {
			if (user.bio !== bio) {
				user.bio = bio
			}
		}
		else {
			user.bio = ''
		}

		if (req.files?.avatar?.length > 0) {
			const imagePath = await compressImage(req.files.avatar[0].path)
			const [deleted, result] = await Promise.all([
				deleteFromCloudinary(user.avatar?.imageId),
				uploadToCloudinary(imagePath),
			])

			const avatarImage = {
				image: result.secure_url,
				imageId: result.public_id,
			}

			user.avatar = avatarImage
		}

		if (req.files?.banner?.length > 0) {
			const imagePath = await compressImage(req.files.banner[0].path)
			const [deleted, result] = await Promise.all([
				deleteFromCloudinary(user.banner?.imageId),
				uploadToCloudinary(imagePath),
			])

			const bannerImage = {
				image: result.secure_url,
				imageId: result.public_id,
			}

			user.banner = bannerImage
		}

		await user.save()

		res.json({
			user,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.searchUsers = async (req, res, next) => {
	try {
		const searchTerm = req.query.search_query

		if (!searchTerm) {
			const error = new HttpError('Search term is required.', 400)
			return next(error)
		}

		const searchWords = searchTerm.split(' ').filter(word => word.length > 0)
		const searchRegexes = searchWords.map(word => new RegExp(word, 'i'))

		const result = await paginatedResponse({
			model: User,
			findQuery: {
				$or: [
					{ name: { $regex: searchTerm, $options: 'i' } },
					{ username: { $regex: searchTerm, $options: 'i' } },
					{ name: { $in: searchRegexes } },
					{ username: { $in: searchRegexes } },
				],
			},
			selectField: '_id name username avatar followers following',
			page: req.query.page,
			limit: req.query.limit,
		})

		result.ok = true
		res.json(result)
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}
