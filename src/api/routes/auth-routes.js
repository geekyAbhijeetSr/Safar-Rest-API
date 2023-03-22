const { Router } = require('express')
const authControllers = require('../controllers/auth-controllers')
const { verifyToken } = require('../middleware/authentication')
const {
	signupValidation,
	loginValidation,
	changePassValidation,
	resetPassValidation,
	forgotPassValidation,
} = require('../validations/auth-validation')
const validate = require('../validations/validate')

const router = Router()

router.post('/signup', signupValidation, validate, authControllers.signup)
router.post('/login', loginValidation, validate, authControllers.login)
router.post('/logout', authControllers.logout)

router.post('/renew-token/:usrId', verifyToken, authControllers.renewToken)

router.put(
	'/change-password',
	verifyToken,
	changePassValidation,
	validate,
	authControllers.changePassword
)


router.post(
	'/forgot-password',
	forgotPassValidation,
	validate,
	authControllers.forgotPassword
)
router.post('/verify-token/:token', authControllers.verifyTokenForResetPass)
router.post(
	'/reset-password/:token',
	resetPassValidation,
	validate,
	authControllers.resetPassword
)

module.exports = router
