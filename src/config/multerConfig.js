const multer = require('multer')
const fs = require('fs')
const HttpError = require('../api/error/http-error')
const path = require('path')
const { nano_id, removeOldFiles } = require('../api/helper/utils')

const UPLOAD_DIR = process.env.ENV === 'production' ? '/tmp' : './uploads'

const errorMessage = {
	LIMIT_FILE_SIZE: 'File size should not be more than 5MB',
	LIMIT_UNEXPECTED_FILE: 'Unexpected file!',
    LIMIT_FIELD_KEY: 'Too many files!',
    
	LIMIT_PART_COUNT: 'Too many parts',
	LIMIT_FILE_COUNT: 'Too many files',
	LIMIT_FIELD_VALUE: 'Field value too long',
	LIMIT_FIELD_COUNT: 'Too many fields',
	MISSING_FIELD_NAME: 'Field name missing',

	// custom error
	FILE_TYPE_ERROR: 'File type is not allowed!',
	DEFAULT_ERROR: 'File upload failed!',
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		if (!fs.existsSync(`${UPLOAD_DIR}/compressed`)) {
			fs.mkdirSync(`${UPLOAD_DIR}/compressed`, { recursive: true })
		}
		cb(null, UPLOAD_DIR)
	},
	filename: async function (req, file, cb) {
		const ext = path.extname(file.originalname)
		if (!ext) {
			req.multerError = errorMessage['FILE_TYPE_ERROR']
			cb(null, false)
		}
		const chars = '0123456789'
		const newName = `img_${await nano_id(12, chars)}`
        const filename = newName + ext
		cb(null, filename)
	},
})

const fileFilter = (req, file, cb) => {
	const allowedMimes = [
		'image/jpeg',
		'image/pjpeg',
		'image/png',
		'image/gif',
		'image/svg+xml',
		'image/webp',
	]


	if (allowedMimes.includes(file.mimetype)) return cb(null, true)

	req.multerError = errorMessage['FILE_TYPE_ERROR']
	return cb(null, false)
}

const limits = {
	fileSize: 5 * 1024 * 1024, // Max file size in bytes (5mb)
}

const multerObj = {
	storage,
	limits,
	fileFilter,
}

exports.multerUploadFile = name => {
	return (req, res, next) => {
		const upload = multer(multerObj).single(name)

		upload(req, res, function (err) {
			if (err && !req.multerError) {
				const message = errorMessage[err.code] || errorMessage['DEFAULT_ERROR']
				req.multerError = message
			}
			return next()
		})
	}
}

exports.multerUploadFiles = (fieldName, maxCount) => {
	return (req, res, next) => {
		const upload = multer(multerObj).array(fieldName, maxCount)

		upload(req, res, function (err) {
			if (err && !req.multerError) {
				const message = errorMessage[err.code] || errorMessage['DEFAULT_ERROR']
				req.multerError = message
			}
			return next()
		})
	}
}

exports.multerUploadMultiFile = fields => {
	return (req, res, next) => {
		// fields example:
		// 	[
		// 		{ name: 'avatar', maxCount: 1 },
		// 		{ name: 'gallery', maxCount: 8 }
		// 	]
		const upload = multer(multerObj).fields(fields)

		upload(req, res, function (err) {
			if (err && !req.multerError) {
				const message = errorMessage[err.code] || errorMessage['DEFAULT_ERROR']
				req.multerError = message
			}
			return next()
		})
	}
}

exports.multerValidate = (req, res, next) => {
	if (req.multerError) {
		const error = new HttpError(req.multerError, 400)
		return next(error)
	}
	return next()
}

exports.removeMulterUploads = async (intervalTime, time) => {
	// intervalTime: time of interval in milliseconds
	// time: time of how much old files should be removed in milliseconds
	setInterval(async () => {
		removeOldFiles(UPLOAD_DIR, time, true)
	}, intervalTime)
}
