const fs = require('fs')
const path = require('path')

const removeLocalFile = async filePath => {
	try {
		fs.unlink(filePath, err => {
			if (err && err.code == 'ENOENT') {
				console.log("Error! File doesn't exist.")
			} else if (err) {
				console.log('Something went wrong')
			} else {
				console.log(`Successfully removed file with the path of ${filePath}`)
			}
		})
	} catch (err) {
		console.error(err)
	}
}

exports.removeLocalFile = removeLocalFile

const removeOldFiles = (dir, milliseconds = 86400000, recursive = false) => {
	// 86400000 ms == 24 hours
	if (!fs.existsSync(dir)) return

	const files_n_dirs_array = fs.readdirSync(dir)

	files_n_dirs_array.forEach(file_or_dir => {
		const path_ = path.join(dir, file_or_dir)
		const stats = fs.statSync(path_)

		const now = new Date()
		const time = milliseconds

		if (stats.isFile() && now - stats.mtime >= time) {
			removeLocalFile(path_)
		} else if (stats.isDirectory() && recursive) {
			removeOldFiles(path_, milliseconds, recursive)
		}
	})
}

exports.removeOldFiles = removeOldFiles

exports.checkIfEmail = str => {
	// Regular expression to check if string is email
	const regexExp =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi

	return regexExp.test(str)
}

exports.nano_id = async (length, chars) => {
	let { nanoid, customAlphabet } = await import('nanoid')
	if (chars) {
		nanoid = customAlphabet(chars)
	}
	return length ? nanoid(length) : nanoid()
}

exports.placeHolderAvatar = () => {
	const names = [
		'cali',
		'zoe',
		'midnight',
		'milo',
		'sheba',
		'toby',
		'sasha',
		'sophie',
		'zoey',
		'mimi',
		'patches',
		'simba',
		'muffin',
		'salem',
		'pepper',
		'sammy',
		'missy',
		'sam',
		'peanut',
		'buddy',
	]

	const name = names[Math.floor(Math.random() * names.length)]
	return `https://api.dicebear.com/5.x/adventurer-neutral/svg?seed=${name}`
}
