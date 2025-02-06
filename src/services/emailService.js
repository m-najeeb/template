// emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Function to generate a random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

// Create a transporter object using the SMTP settings
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false, 
    },
});

// Function to send OTP via email
const sendOTP = async (toEmail) => {
    const otp = generateOTP();

    const mailOptions = {
        from: `"${process.env.DISPLAY_NAME}" <${process.env.FROM_EMAIL}>`,
        to: toEmail,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
        html: `<strong>Your OTP code is ${otp}. It will expire in 10 minutes.</strong>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return otp;
    } catch (error) {
        throw new Error('Failed to send OTP');
    }
};

module.exports = { sendOTP };
