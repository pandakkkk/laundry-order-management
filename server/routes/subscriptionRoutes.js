const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { protectCustomer, protect } = require('../middleware/auth');

const router = express.Router();

// Public — anyone can browse plans.
router.get('/plans', subscriptionController.listPlans);

// Admin — plan CRUD.
router.post('/plans', protect, subscriptionController.createPlan);
router.patch('/plans/:slug', protect, subscriptionController.updatePlan);

// Admin — active subscription management (support workflows)
router.get('/admin/list', protect, subscriptionController.adminList);
router.post('/admin/:id/pause', protect, subscriptionController.adminPause);
router.post('/admin/:id/resume', protect, subscriptionController.adminResume);
router.post('/admin/:id/cancel', protect, subscriptionController.adminCancel);

// Customer — auth required for the rest.
router.use(protectCustomer);
router.post('/subscribe', subscriptionController.subscribe);
router.post('/confirm', subscriptionController.confirm);
router.get('/mine', subscriptionController.mine);
router.post('/:id/pause', subscriptionController.pause);
router.post('/:id/resume', subscriptionController.resume);
router.post('/:id/cancel', subscriptionController.cancel);

module.exports = router;
