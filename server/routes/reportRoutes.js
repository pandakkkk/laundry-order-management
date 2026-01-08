const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const reportController = require('../controllers/reportController');

// All report routes require authentication and REPORTS_VIEW permission
router.use(protect);

// Dashboard overview stats
router.get('/dashboard', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getDashboardStats);

// Revenue trends
router.get('/revenue', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getRevenueTrends);

// Orders by status
router.get('/orders-by-status', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getOrdersByStatus);

// Top customers
router.get('/top-customers', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getTopCustomers);

// Popular services
router.get('/popular-services', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getPopularServices);

// Staff performance
router.get('/staff-performance', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getStaffPerformance);

// Peak hours analysis
router.get('/peak-hours', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getPeakHours);

// Export report
router.get('/export', checkPermission(PERMISSIONS.REPORTS_EXPORT), reportController.exportReport);

// Custom date range report
router.get('/custom-range', checkPermission(PERMISSIONS.REPORTS_VIEW), reportController.getCustomRangeReport);

module.exports = router;

