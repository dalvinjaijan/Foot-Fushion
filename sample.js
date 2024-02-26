const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Function to generate OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dalvinjaijan2002@gmail.com', // Replace with your email
        pass: 'vvpu fmjc nqry ewwj' // Replace with your email password
    }
});

router.post('/signup', (req, res) => {
    // Generate OTP
    const otp = generateOTP();

    // Send OTP via email
    const mailOptions = {
        from: 'dalvinjaijan2002@gmail.com', // Replace with your email
        to: req.body.email, // Get the email from the form
        subject: 'OTP Verification',
        text: `Your OTP for registration is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send('Error sending OTP via email');
        } else {
            console.log('Email sent: ' + info.response);
            // Now you can proceed to render the verification form with the OTP
            res.render('verify-otp', { email: req.body.email, otp });
        }
    });
});

module.exports = router;






//