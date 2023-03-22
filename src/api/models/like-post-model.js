const mongoose = require('mongoose')

const likePostSchema = new mongoose.Schema({
	post: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Post',
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	},
})

const LikePost = mongoose.model('LikePost', likePostSchema)

module.exports = LikePost
