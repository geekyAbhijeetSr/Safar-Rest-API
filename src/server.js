const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const connectDB = require('./config/connectDB')
const errorHandler = require('./api/error/error-handler')
const unknownRoutesHandler = require('./api/error/unknown-routes-handler')
const authRoutes = require('./api/routes/auth-routes')
const postRoutes = require('./api/routes/post-routes')
const userRoutes = require('./api/routes/user-routes')
const { removeMulterUploads } = require('./config/multerConfig')

// basic config
const server = express()
server.use(helmet())
server.use(express.json())
server.use(express.urlencoded({ extended: true }))
server.use(cookieParser())
server.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }))

// routes
server.use('/auth', authRoutes)
server.use('/post', postRoutes)
server.use('/user', userRoutes)

// error handing
server.use(unknownRoutesHandler)
server.use(errorHandler)

// connect to DB and start server
;(async () => {
	const PORT = process.env.PORT
	await connectDB()
	server.listen(PORT, () => console.log(`Server is running on port ${PORT}\n`))

	removeMulterUploads(5 * 60 * 1000, 5 * 60 * 1000)
})()
