const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			trim: true,
		},
		name: {
			type: String,
			trim: true,
		},
		avatar: {
			image: String,
			imageId: String,
		},
		banner: {
			image: String,
			imageId: String,
		},
		bio: {
			type: String,
			default: '',
		},
		email: {
			type: String,
			trim: true,
		},
		password: {
			type: String,
			select: false,
		},

		followers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		noOfFollowers: {
			type: Number,
			default: 0,
		},

		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		noOfFollowing: {
			type: Number,
			default: 0,
		},

		posts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Post',
			},
		],
		noOfPosts: {
			type: Number,
			default: 0,
		},

		likedPosts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'LikePost',
			},
		],
		noOfLikedPosts: {
			type: Number,
			default: 0,
		},

		savedPosts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'SavePost',
			},
		],
		noOfSavedPosts: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
)

userSchema.pre('save', async function (next) {
	const user = this
	try {
		if (user.isModified('password')) {
			const salt = await bcrypt.genSalt(10)
			user.password = await bcrypt.hash(user.password, salt)
		}
		next()
	} catch (err) {
		next(err)
	}
})

userSchema.methods = {
	comparePassword: async function (password) {
		const user = this
		return await bcrypt.compare(password, user.password)
	},
}

const User = mongoose.model('User', userSchema)

module.exports = User
