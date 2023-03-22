const { Router } = require('express')
const {
	multerValidate,
	multerUploadMultiFile,
} = require('../../config/multerConfig')
const userControllers = require('../controllers/user-controllers')
const { verifyToken } = require('../middleware/authentication')
const { editProfileValidation } = require('../validations/edit-profile-validation')
const validate = require('../validations/validate')

const router = Router()

router.get('/search-users', userControllers.searchUsers)
router.get('/:username', userControllers.getUser)
router.put('/follow/:userId', verifyToken, userControllers.follow)
router.put('/unfollow/:userId', verifyToken, userControllers.unfollow)
router.put(
	'/edit/:userId',
	verifyToken,
	multerUploadMultiFile([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'banner', maxCount: 1 },
	]),
    multerValidate,
    editProfileValidation,
    validate,
	userControllers.editUser
)

module.exports = router
