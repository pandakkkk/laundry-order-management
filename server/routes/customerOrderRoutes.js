const express = require('express');
const customerOrderController = require('../controllers/customerOrderController');
const { protectCustomer } = require('../middleware/auth');

const router = express.Router();
router.use(protectCustomer);

router.get('/', customerOrderController.list);
router.get('/:ticketNumber', customerOrderController.get);

module.exports = router;
