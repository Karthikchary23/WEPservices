const express = require('express');
const router = express.Router();
const {customerSignUp} = require('../Controllers/CustomerAuth');
const {CustomerSignInOtpRequest}= require('../Controllers/CustomerSigninOtp');
const {CustomerLogin}= require('../Controllers/CustomerSignin');
const {CustomerTokenverifcation}= require('../Controllers/CustomerTokenVerify');
const {CustomerlocationUpdate} =require('../Controllers/Customerlocation')
const {ServicesRecievedCountForCustomer,ServicesRejectedCountForCustomer} = require('../Controllers/CustomerServicesCount')

router.post('/customersignup', customerSignUp);
router.post('/customerdashboardsigninotpsend-otp', CustomerSignInOtpRequest);
router.post('/signin', CustomerLogin);
router.post('/customertokenverify', CustomerTokenverifcation);
router.post('/update-location',CustomerlocationUpdate)
router.post('/servicerecievedcount',ServicesRecievedCountForCustomer);
router.post('/servicerejectedcount',ServicesRejectedCountForCustomer);

module.exports = router;