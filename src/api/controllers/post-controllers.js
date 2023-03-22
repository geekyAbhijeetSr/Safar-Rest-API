const Post = require('../models/post-model')
const User = require('../models/user-model')
const SavePost = require('../models/save-post-model')
const LikePost = require('../models/like-post-model')
const HttpError = require('../error/http-error')
const {
	uploadToCloudinary,
	cloudinaryUrlTransformer,
	compressImage,
	deleteFromCloudinary,
} = require('../../config/cloudinaryConfig')
const { paginatedResponse } = require('../middleware/pagination')

exports.createPost = async (req, res, next) => {
	try {
		const { userId } = req.tokenPayload
		const { location, caption } = req.body

		const currentUser = await User.findById(userId)

		if (!currentUser) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		const imagePath = await compressImage(req.file.path)
		const result = await uploadToCloudinary(imagePath)
		const thumbImageUrl = cloudinaryUrlTransformer(result.secure_url, 'square')

		const image = {
			thumbnail: thumbImageUrl,
			original: result.secure_url,
			imageId: result.public_id,
		}

		const newPostObj = {
			author: currentUser._id,
			location,
			caption,
			image,
		}

		const newPost = new Post(newPostObj)

		await newPost.save()

		currentUser.posts.push(newPost)
		currentUser.noOfPosts++

		await currentUser.save()

		await newPost.populate({
			path: 'author',
			select: '_id username name avatar followers',
		})

		res.status(200).json({
			post: newPost,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.editPost = async (req, res, next) => {
	try {
		const { postId } = req.params
		const { userId } = req.tokenPayload
		const { location, caption } = req.body

		const [currentUser, post] = await Promise.all([
			User.findById(userId),
			Post.findById(postId),
		])

		if (!post) {
			const error = new HttpError('Post not found!', 404)
			return next(error)
		}

		if (!currentUser) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		if (post.author.toString() !== currentUser._id.toString()) {
			const error = new HttpError('You are not the author of this post!', 400)
			return next(error)
		}

		post.location = location
		post.caption = caption

		await post.save()
		await post.populate({
			path: 'author',
			select: '_id username name avatar followers',
		})

		res.json({
			post,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.deletePosts = async (req, res, next) => {
	try {
		const { postId } = req.params
		const { userId } = req.tokenPayload

		const [currentUser, post] = await Promise.all([
			User.findById(userId),
			Post.findById(postId),
		])

		if (!post) {
			const error = new HttpError('Post not found!', 404)
			return next(error)
		}

		if (!currentUser) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		if (post.author.toString() !== currentUser._id.toString()) {
			const error = new HttpError('You are not the author of this post!', 400)
			return next(error)
		}

		await Promise.all([deleteFromCloudinary(post.image.imageId), post.remove()])

		const foundIndex = currentUser.posts.findIndex(
			post => post._id.toString() === postId
		)

		currentUser.posts.splice(foundIndex, 1)
		currentUser.noOfPosts--

		await currentUser.save()

		res.json({
			postId,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.toggleLikePost = async (req, res, next) => {
	try {
		const { postId } = req.params
		const { userId } = req.tokenPayload

		const [currentUser, post] = await Promise.all([
			User.findById(userId),
			Post.findById(postId),
		])

		if (!post) {
			const error = new HttpError('Post not found!', 404)
			return next(error)
		}

		if (!currentUser) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		if (!post.likedBy.includes(userId)) {
			post.likedBy.push(userId)
			post.noOfLikes++

			const likePost = new LikePost({
				post: postId,
			})
			await likePost.save()

			currentUser.likedPosts.push(likePost)
			currentUser.noOfLikedPosts++
		} else {
			const indexOfLikedBy = post.likedBy.indexOf(userId)
			if (indexOfLikedBy !== -1) {
				post.likedBy.splice(indexOfLikedBy, 1)
				post.noOfLikes--
			}

			await User.populate(currentUser, {
				path: 'likedPosts',
			})

			const indexOfLikedPosts = currentUser.likedPosts.findIndex(
				lp => lp.post.toString() === postId
			)

			if (indexOfLikedPosts !== -1) {
				const removed = currentUser.likedPosts.splice(indexOfLikedPosts, 1)
				currentUser.noOfLikedPosts--

				await LikePost.findOneAndDelete({ _id: removed[0]._id })
			}
		}

		await Promise.all([post.save(), currentUser.save()])

		await post.populate({
			path: 'author',
			select: '_id username name avatar followers',
		})

		res.status(201).json({
			post,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.toggleSavePost = async (req, res, next) => {
	try {
		const { postId } = req.params
		const { userId } = req.tokenPayload

		const [currentUser, post] = await Promise.all([
			User.findById(userId),
			Post.findById(postId),
		])

		if (!post) {
			const error = new HttpError('Post not found!', 404)
			return next(error)
		}

		if (!currentUser) {
			const error = new HttpError('User not found!', 404)
			return next(error)
		}

		if (!post.savedBy.includes(userId)) {
			post.savedBy.push(userId)
			post.noOfSaves++

			const savePost = new SavePost({
				post: postId,
			})

			await savePost.save()

			currentUser.savedPosts.push(savePost)
			currentUser.noOfSavedPosts++
		} else {
			const indexOfSavedBy = post.savedBy.indexOf(userId)
			if (indexOfSavedBy !== -1) {
				post.savedBy.splice(indexOfSavedBy, 1)
				post.noOfSaves--
			}

			await User.populate(currentUser, {
				path: 'savedPosts',
			})

			const indexOfSavedPost = currentUser.savedPosts.findIndex(
				sp => sp.post.toString() === postId
			)

			if (indexOfSavedPost !== -1) {
				const removed = currentUser.savedPosts.splice(indexOfSavedPost, 1)
				currentUser.noOfSavedPosts--

				await SavePost.findOneAndDelete({ _id: removed[0]._id })
			}
		}

		await Promise.all([post.save(), currentUser.save()])

		await post.populate({
			path: 'author',
			select: '_id username name avatar followers',
		})

		res.status(201).json({
			post,
			ok: true,
		})
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.getUserPosts = async (req, res, next) => {
	try {
		const { userId } = req.params

		const result = await paginatedResponse({
			model: Post,
			findQuery: { author: userId },
			sortQuery: { _id: -1 },
			page: req.query.page,
			limit: req.query.limit,
		})

		await Post.populate(result.docs, {
			path: 'author',
			select: '_id username name avatar followers',
		})

		result.ok = true
		res.json(result)
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.getAllPosts = async (req, res, next) => {
	try {
		const result = await paginatedResponse({
			model: Post,
			findQuery: {},
			sortQuery: { _id: -1 },
			page: req.query.page,
			limit: req.query.limit,
		})

		await Post.populate(result.docs, {
			path: 'author',
			select: '_id username name avatar followers',
		})

		result.ok = true
		res.json(result)
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.getFollowingPosts = async (req, res, next) => {
	try {
		const { userId } = req.tokenPayload

		const currentUser = await User.findById(userId)

		const result = await paginatedResponse({
			model: Post,
			findQuery: { author: { $in: currentUser.following } },
			sortQuery: { _id: -1 },
			page: req.query.page,
			limit: req.query.limit,
		})

		await Post.populate(result.docs, {
			path: 'author',
			select: '_id username name avatar followers',
		})
		
		result.ok = true
		res.json(result)
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}

exports.getSavedPosts = async (req, res, next) => {
	try {
		const { userId } = req.tokenPayload

		const currentUser = await User.findById(userId)

		const result = await paginatedResponse({
			model: SavePost,
			findQuery: { _id: { $in: currentUser.savedPosts } },
			sortQuery: { _id: -1 },
			page: req.query.page,
			limit: req.query.limit,
		})

		await SavePost.populate(result.docs, {
			path: 'post',
			populate: {
				path: 'author',
				select: '_id username name avatar followers',
			},
		})

		const posts = result.docs.filter(sp => sp.post).map(sp => sp.post)

		result.docs = posts
		result.ok = true
		res.json(result)
	} catch (err) {
		console.error(err)
		const error = new HttpError()
		return next(error)
	}
}
