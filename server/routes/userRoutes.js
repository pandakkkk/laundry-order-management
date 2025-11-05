const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Get user permissions
router.get('/permissions', protect, (req, res) => {
  const { getRolePermissions, ROLES } = require('../config/permissions');
  
  const permissions = getRolePermissions(req.user.role);
  const roleInfo = ROLES[req.user.role];
  
  res.json({
    success: true,
    role: req.user.role,
    roleInfo,
    permissions
  });
});

module.exports = router;

