require('dotenv').config();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const ServiceProvider = require('../models/Serviceprovider');
const Customer = require('../models/Customermodel');
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to send OTP via email
async function sendOtpEmail(email, otp) {
    console.log(email);
    console.log(process.env.EMAIL_USER)
    console.log(process.env.EMAIL_PASS)
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        
        auth: {
            user: process.env.EMAIL_USER, // Ensure environment variables are set
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    console.log(otp);

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send OTP email");
    }
}

// Main function to handle OTP generation, sending, and updating
async function handleOtpRequest(req, res) {
    const { email, mobile } = req.body;
    console.log(email);

    try {
        const existingUser = await ServiceProvider.findOne({
            $or: [{ email }, { mobile }]
        });
        console.log("Existing user:");
        console.log(existingUser);
        const existingCustomer = await Customer.findOne({ email });
        console.log("Existing customer:");
        console.log(existingCustomer);

        if (existingUser || existingCustomer) {
            return res.status(400).json({ message: 'You mail id or a phone number exist as Cstomer or as an Employee' });
        }

        console.log("User does not exist, sending OTP...");

        const otp = generateOtp();


        try {
            await sendOtpEmail(email, otp);
        } catch (error) {
            return res.status(500).json({ message: 'Error sending OTP', error: error.message });
        }

        res.status(200).json({ message: 'OTP sent successfully', otp });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function passwordForgotOtpRequest(req, res) {
    const { email } = req.body;
    console.log(email);

    try {
        const existingUser = await ServiceProvider.findOne({ email });
    
        const existingCustomer = await Customer.findOne({ email });

        if (existingUser || existingCustomer) {
            const otp = generateOtp();
            console.log("User does not exist, sending OTP...");
            try {
                await sendOtpEmail(email, otp);
            } catch (error) {
                return res.status(500).json({ message: 'Error sending OTP', error: error.message });
            }
            res.status(200).json({ message: 'OTP sent successfully', otp });
        } else{
            return res.status(400).json({ message: 'Email does not exist' });
        }
    }
    catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
            
}

async function updateNewPassword(req, res) {
    const { email, newPassword } = req.body;
    console.log(email);

    try {
        const existingUser = await ServiceProvider.findOne({ email });
        const existingCustomer = await Customer.findOne({ email });
        if (existingUser) {
            const salt = await bcrypt.genSalt(10);  // Generate salt
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            existingUser.password = hashedPassword;
            await existingUser.save();
            return res.status(200).json({ message: 'Password updated successfully' });
        }
        else if (existingCustomer) {
            const salt = await bcrypt.genSalt(10);  // Generate salt
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            existingCustomer.password = hashedPassword;
            await existingCustomer.save();
            return res.status(200).json({ message: 'Password updated successfully' });
        } else {
            return res.status(400).json({ message: 'Email does not exist' });
        }
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

module.exports = {
    handleOtpRequest,passwordForgotOtpRequest,updateNewPassword
};
