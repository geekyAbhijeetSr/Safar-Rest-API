const cloudinary = require('cloudinary').v2
const sharp = require('sharp')
const { nano_id } = require('../api/helper/utils')
const { removeLocalFile } = require('../api/helper/utils')

const rootFolder = 'Safar/'
const UPLOAD_DIR = process.env.ENV === 'production' ? '/tmp' : './uploads'

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
})

exports.uploadToCloudinary = async (localFilePath, folder) => {
	try {
		const cloudinaryFolder = folder
			? `${rootFolder}/${folder}/`
			: `${rootFolder}/`

		const result = await cloudinary.uploader.upload(localFilePath, {
			folder: cloudinaryFolder,
		})

		removeLocalFile(localFilePath)
		return result
	} catch (err) {
		removeLocalFile(localFilePath)
		console.error(err)
	}
}

exports.deleteFromCloudinary = async publicId => {
	if (!publicId) return
	const { result } = await cloudinary.uploader.destroy(publicId)
	return result
}

exports.compressImage = async (
	localFilePath,
	quality = 80,
	width = 1080,
	height
) => {
	try {
		const chars = '0123456789'
		const newName = `img_${await nano_id(12, chars)}.avif`
		const newPath = `${UPLOAD_DIR}/compressed/${newName}`

		await sharp(localFilePath)
			.resize(width, height)
			.toFormat('avif')
			.avif({ quality })
			.toFile(newPath)

		removeLocalFile(localFilePath)

		return newPath
	} catch (err) {
		console.error(err)
	}
}

exports.cloudinaryUrlTransformer = (url, type) => {
	const index = url.indexOf('upload/') + 7
	const urlSlice1 = url.slice(0, index)
	const urlSlice2 = url.slice(index)

	let params
	switch (type) {
		// avatar image quality variations
		case 'avatar':
			params = 'c_fill,g_face,h_400,w_400,q_auto:good/'
			break
		case 'avatar_face':
			params = 'c_crop,g_face,h_200,w_200,q_auto:low/'
			break
		case 'avatar_small':
			params = 'c_fill,g_face,h_200,w_200,q_auto:low/'
			break
		// 1:1 image quality variations
		case 'square':
			params = 'c_fill,h_624,w_624,q_auto:good/'
			break
		case 'square_medium':
			params = 'c_fill,h_450,w_450,q_auto:good/'
			break
		case 'square_small':
			params = 'c_fill,h_250,w_250,q_auto:low/'
			break
		// other image quality variations
		case 'q_good':
			params = 'q_auto:good/'
			break
		case 'q_medium':
			params = 'q_60/'
			break
		case 'q_low':
			params = 'q_auto:low/'
			break
		default:
			params = ''
	}

	return urlSlice1 + params + urlSlice2
}
