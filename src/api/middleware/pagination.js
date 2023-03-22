exports.paginatedResponse = async (params = {}) => {
	const { model, findQuery = {}, sortQuery = {}, selectField = '', page, limit } = params
	if (!model) return null
	const page_ = page ? parseInt(page) : 1
	const limit_ = limit ? parseInt(limit) : 10

	const startIndex = (page_ - 1) * limit_
	const endIndex = page_ * limit_

	const results = {}

	const [docs, totalDocs] = await Promise.all([
		model.find(findQuery).select(selectField).sort(sortQuery).skip(startIndex).limit(limit_),
		model.find(findQuery).countDocuments(),
	])

	results.docs = docs
	results.totalDocs = totalDocs
	results.limit = limit_

	if (startIndex > 0) {
		results.previousPage = page_ - 1
	}

	if (endIndex < totalDocs) {
		results.nextPage = page_ + 1
	}

	return results
}
