const express = require('express');
const router = express.Router();
const { handleOtpRequest } = require('../Controllers/OtpController');
const { ServiceprovideSignInOtpRequest} = require('../Controllers/LoginOtpContoller');
const{OtpVerification}=require("../Controllers/OtpVerification");
const {passwordForgotOtpRequest}=require("../Controllers/OtpController");
const {updateNewPassword}=require("../Controllers/OtpController")
router.post('/send-otp', handleOtpRequest);
router.post('/serviceprovidersigninotpsend-otp', ServiceprovideSignInOtpRequest);
router.post('/otpverification',OtpVerification)
router.post('/forgot-password/send-otp', passwordForgotOtpRequest);
router.post('/password/reset-password', updateNewPassword);
module.exports = router;