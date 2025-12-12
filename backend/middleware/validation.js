const { body, validationResult } = require('express-validator');

// Validation rules for agency registration
const validateRegistration = [
  body('agency_name').trim().notEmpty().withMessage('Agency name is required'),
  body('contact_name').trim().notEmpty().withMessage('Contact name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('website').optional().isURL().withMessage('Valid URL required for website'),
  body('description').optional().trim()
];

// Validation rules for login
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation rules for project creation
const validateProject = [
  body('title').trim().notEmpty().withMessage('Project title is required'),
  body('description').trim().notEmpty().withMessage('Project description is required'),
  body('project_type').isIn(['collaboration', 'overflow', 'shared_account', 'joint_venture', 'other'])
    .withMessage('Invalid project type')
];

// Validation rules for response
const validateResponse = [
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('contact_email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

// Validation rules for review
const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
];

// Middleware to handle validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    req.flash('error', errorMessages.join(', '));
    return res.redirect('back');
  }
  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateProject,
  validateResponse,
  validateReview,
  handleValidationErrors
};
