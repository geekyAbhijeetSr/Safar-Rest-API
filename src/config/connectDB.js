const mongoose = require('mongoose')
const URI = process.env.MONGODB_URI

const connectDB = async () => {
	try {
		await mongoose.set('strictQuery', false)
		await mongoose.connect(URI)
		console.log('\nConnected to MongoDB')
	} catch (err) {
		console.error(err)
	}
}

module.exports = connectDB
