const randomstring = require('randomstring')
const nodemailer = require('nodemailer');
require('dotenv').config()



function generateOTP() {
    return randomstring.generate({
        length: 6,
        charset: 'numeric'
    })
}


async function mailer(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email, // Replace with your email
                pass: process.env.password // Replace with your email password
            }
        });
        // Send OTP via email
        const mailOptions = {
            from: 'dalvinjaijan2002@gmail.com', // Replace with your email
            to: email, // Get the email from the form
            subject: 'OTP Verification',
            text: `Your OTP for registration is: ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                // res.status(500).send('Error sending OTP via email');
                return false
            } else {
                console.log('Email sent: ' + info.response);
                // Now you can proceed to render the verification form with the OTP
                return true
            }
        });
    } catch (error) {
        console.log(error.message)
    }
}



module.exports = {
    generateOTP,
    mailer
};