const { Router } = require('express')
const {
	multerUploadFile,
	multerValidate,
} = require('../../config/multerConfig')
const postControllers = require('../controllers/post-controllers')
const { verifyToken } = require('../middleware/authentication')
const { postValidation } = require('../validations/post-validation')
const validate = require('../validations/validate')

const router = Router()

router.post(
	'/create',
	verifyToken,
	multerUploadFile('postimage'),
	multerValidate,
	postValidation,
	validate,
	postControllers.createPost
)

router.get('/userposts/:userId', postControllers.getUserPosts)
router.get('/globalposts', postControllers.getAllPosts)
router.get('/followingposts', verifyToken, postControllers.getFollowingPosts)
router.get('/savedposts', verifyToken, postControllers.getSavedPosts)

router.put('/likepost/:postId', verifyToken, postControllers.toggleLikePost)
router.put('/savepost/:postId', verifyToken, postControllers.toggleSavePost)
router.put(
	'/edit/:postId',
	postValidation,
	validate,
	verifyToken,
	postControllers.editPost
)

router.delete('/delete/:postId', verifyToken, postControllers.deletePosts)

module.exports = router
