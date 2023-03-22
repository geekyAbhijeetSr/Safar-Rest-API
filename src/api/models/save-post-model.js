const mongoose = require('mongoose')

const savePostSchema = new mongoose.Schema(
	{
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Post',
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        }
	}
)

const SavePost = mongoose.model('SavePost', savePostSchema)

module.exports = SavePost
