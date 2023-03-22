const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	caption: String,
	location: String,
	image: {
		thumbnail: String,
		original: String,
		imageId: String,
	},
	likedBy: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],
	noOfLikes: {
		type: Number,
		default: 0,
	},
	savedBy: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],
	noOfSaves: {
		type: Number,
		default: 0,
	},
}, {
	timestamps: true
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post
