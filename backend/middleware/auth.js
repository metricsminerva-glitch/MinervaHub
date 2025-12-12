// Authentication middleware for agencies
function requireAuth(req, res, next) {
  if (req.session && req.session.agencyId) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  res.redirect('/login');
}

// Authentication middleware for admin users
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.flash('error', 'Admin access required');
  res.redirect('/admin/login');
}

// Check if agency is approved
function requireApproved(req, res, next) {
  if (req.session && req.session.agencyStatus === 'approved') {
    return next();
  }
  req.flash('error', 'Your account is pending approval');
  res.redirect('/dashboard');
}

// Middleware to attach user data to response locals
function attachUser(req, res, next) {
  res.locals.user = null;
  res.locals.isAdmin = false;

  if (req.session && req.session.agencyId) {
    const Agency = require('../models/Agency');
    const agency = Agency.findById(req.session.agencyId);
    if (agency) {
      res.locals.user = agency;
    }
  }

  if (req.session && req.session.adminId) {
    res.locals.isAdmin = true;
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireApproved,
  attachUser
};
