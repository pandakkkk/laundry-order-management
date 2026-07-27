const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const { attachCustomer } = require('../middleware/auth');

const router = express.Router();

router.use(attachCustomer);

router.post('/initiate', checkoutController.initiate);
router.post('/confirm', checkoutController.confirm);

module.exports = router;
