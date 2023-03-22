const nodemailer = require('nodemailer')

let mailTransporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: 'nor666108@gmail.com',
		pass: 'quqryqqxklxcppdy',
	},
})

module.exports = mailTransporter