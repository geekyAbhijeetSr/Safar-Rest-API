const nodemailer = require('nodemailer')

let mailTransporter = nodemailer.createTransport({
	host: process.env.NODE_MAILER_HOST,
	port: 465,
	secure: true,
	auth: {
		user: process.env.NODE_MAILER_USER,
		pass: process.env.NODE_MAILER_PASS,
	},
})

module.exports = mailTransporter