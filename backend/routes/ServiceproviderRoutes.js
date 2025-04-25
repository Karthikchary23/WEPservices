const express = require('express');
const router = express.Router();
const { Servicesignup } = require('../Controllers/Serviceproviderauth');
const { ServiceproviderSignin } = require('../Controllers/ServiceproviderLogin');
const { ServiceproviderTokenverifcation } = require('../Controllers/ServiceproviderTokenverify');
const { ServiceProvicerlocationUpdate } = require('../Controllers/ServiceProviderLocation');
const{UpdateAvailablestatus}=require("../Controllers/Available")
const {ServicesRejectedCountForProvider, ServicesProvidedCountForProvider} = require('../Controllers/ProviderServicesCount');

router.post('/service-providersignup', Servicesignup);
router.post('/signin', ServiceproviderSignin);
router.post('/serviceprovidertokenverify', ServiceproviderTokenverifcation);
router.post('/update-location',ServiceProvicerlocationUpdate)
router.post("/isavailable",UpdateAvailablestatus)
router.post('/servicesprovidedcount',ServicesProvidedCountForProvider)
router.post('/servicesrejectedcount',ServicesRejectedCountForProvider);

module.exports = router;