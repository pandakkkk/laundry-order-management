const express = require('express');
const walletController = require('../controllers/walletController');
const { protectCustomer } = require('../middleware/auth');

const router = express.Router();
router.use(protectCustomer);

router.get('/', walletController.summary);
router.get('/history', walletController.history);
router.post('/topup/initiate', walletController.topupInitiate);
router.post('/topup/confirm', walletController.topupConfirm);

module.exports = router;
