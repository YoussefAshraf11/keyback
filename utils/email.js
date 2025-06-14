var nodemailer = require('nodemailer');

exports.sendEmail = (email, subject, text) => {
    // Validate environment variables
    if (!process.env.FROM_EMAIL || !process.env.EMAIL_PASS) {
        console.error('Missing required environment variables: FROM_EMAIL or EMAIL_PASS');
        return Promise.reject(new Error('Email service configuration is incomplete'));
    }

    console.log('Creating transporter with email:', process.env.FROM_EMAIL);
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.FROM_EMAIL,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Verify connection configuration
    transporter.verify(function(error, success) {
        if (error) {
            console.error('Error verifying email configuration:', error);
        } else {
            console.log('Server is ready to take our messages');
        }
    });

    const mailOptions = {
        from: `"KeyFinder" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: subject,
        text: `Hello,\n\n${text}\n\nBest regards,\nKeyFinder Team`
    };

    console.log('Sending email with options:', {
        to: email,
        subject: subject
    });

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.error('Error sending email:', error);
                reject(error);
            } else {
                console.log('Email sent:', info.messageId);
                resolve(info);
            }
        });
    });
};
