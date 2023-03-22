const HttpError = require('../error/http-error')

exports.canModify = (model, notFoundError, notAllowedError) => {
	return async (req, res, next) => {
		const { id } = req.params

		const doc = await model.findById(id)

		if (!doc) {
			const error = new HttpError(notFoundError)
			return next(error)
		}

		if (doc.createdBy.toString() !== req.user.id) {
			const error = new HttpError(notAllowedError)
			return next(error)
		}

		req.doc = doc

		next()
	}
}
