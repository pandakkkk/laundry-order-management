const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { PERMISSIONS, getAllRoles, getRoleInfo, canManageRole } = require('../config/permissions');
const User = require('../models/User');

// ============================================
// Get current user permissions
// ============================================
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

// ============================================
// Get all available roles (for dropdowns)
// ============================================
router.get('/roles', protect, (req, res) => {
  const roles = getAllRoles();
  
  res.json({
    success: true,
    roles
  });
});

// ============================================
// Get all users (Admin/Manager/HR only)
// ============================================
router.get('/', protect, checkPermission(PERMISSIONS.USER_VIEW), async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching users'
    });
  }
});

// ============================================
// Get user by ID
// ============================================
router.get('/:id', protect, checkPermission(PERMISSIONS.USER_VIEW), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user'
    });
  }
});

// ============================================
// Create new user (Admin/HR only)
// ============================================
router.post('/', protect, checkPermission(PERMISSIONS.USER_CREATE), async (req, res) => {
  try {
    const { email, password, name, phone, role, department } = req.body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }
    
    // Check if user can create this role
    if (role && !canManageRole(req.user.role, role) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You cannot create a user with this role'
      });
    }
    
    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: role || 'staff',
      department: department || 'Operations',
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        department: user.department,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating user',
      message: error.message
    });
  }
});

// ============================================
// Update user
// ============================================
router.put('/:id', protect, checkPermission(PERMISSIONS.USER_UPDATE), async (req, res) => {
  try {
    const { name, phone, role, department, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user can update this role
    if (role && role !== user.role) {
      if (!canManageRole(req.user.role, role) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'You cannot assign this role'
        });
      }
    }
    
    // Prevent non-admin from modifying admin users
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You cannot modify admin users'
      });
    }
    
    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (department) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating user'
    });
  }
});

// ============================================
// Delete user (Admin only)
// ============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting user'
    });
  }
});

// ============================================
// Reset user password (Admin/HR only)
// ============================================
router.post('/:id/reset-password', protect, checkPermission(PERMISSIONS.USER_UPDATE), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent non-admin from resetting admin password
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You cannot reset admin password'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Error resetting password'
    });
  }
});

// ============================================
// Toggle user active status
// ============================================
router.post('/:id/toggle-status', protect, checkPermission(PERMISSIONS.USER_UPDATE), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent deactivating self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account'
      });
    }
    
    // Prevent non-admin from deactivating admin
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You cannot deactivate admin users'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      user,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      error: 'Error toggling user status'
    });
  }
});

// ============================================
// Get user stats (for dashboard)
// ============================================
router.get('/stats/summary', protect, checkPermission(PERMISSIONS.USER_VIEW), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // Count by role
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const roleCount = {};
    roleStats.forEach(stat => {
      roleCount[stat._id] = stat.count;
    });
    
    res.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: roleCount
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user stats'
    });
  }
});

module.exports = router;
