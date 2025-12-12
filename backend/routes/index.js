const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const agencyController = require('../controllers/agencyController');
const projectController = require('../controllers/projectController');
const reviewController = require('../controllers/reviewController');
const { requireAuth, requireApproved } = require('../middleware/auth');
const { 
  checkProjectLimit, 
  checkResponseLimit,
  incrementProjectCounter,
  incrementResponseCounter 
} = require('../middleware/subscription');
const {
  validateRegistration,
  validateLogin,
  validateProject,
  validateResponse,
  validateReview,
  handleValidationErrors
} = require('../middleware/validation');

// Public Routes
router.get('/', (req, res) => {
  res.render('pages/home', { 
    title: 'Minerva Metrics Hub',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// New Static Pages
router.get('/about', (req, res) => res.render('pages/about', { title: 'About Us' }));
router.get('/help', (req, res) => res.render('pages/help-center', { title: 'Help Center' }));
router.get('/faq', (req, res) => res.render('pages/faq', { title: 'FAQ' }));
router.get('/contact', (req, res) => res.render('pages/contact', { title: 'Contact Us' }));
router.get('/privacy-policy', (req, res) => res.render('pages/privacy-policy', { title: 'Privacy Policy' }));
router.get('/terms', (req, res) => res.render('pages/terms-of-service', { title: 'Terms of Service' }));
router.get('/how-it-works', (req, res) => res.render('pages/how-it-works', { title: 'How It Works' }));
router.get('/cookies', (req, res) => res.render('pages/cookie-policy', { title: 'Cookie Policy' }));
router.post('/contact/submit', authController.submitContactForm);

// New Ticket System Routes
router.get('/support/tickets', requireAuth, agencyController.showTickets);
router.post('/support/tickets', requireAuth, agencyController.createTicket);
router.get('/support/tickets/:id', requireAuth, agencyController.viewTicket);
router.post('/support/tickets/:id/respond', requireAuth, agencyController.respondToTicket);

// Auth routes
router.get('/register', authController.showRegister);
router.post('/register', validateRegistration, handleValidationErrors, authController.register);
router.get('/login', authController.showLogin);
router.post('/login', validateLogin, handleValidationErrors, authController.login);
router.get('/logout', authController.logout);

// Agency routes (protected)
router.get('/dashboard', requireAuth, agencyController.showDashboard);
router.get('/profile/edit', requireAuth, agencyController.showEditProfile);
router.post('/profile/edit', requireAuth, agencyController.updateProfile);
router.get('/agencies/:id', agencyController.showPublicProfile);

// Project routes
router.get('/projects', projectController.showProjects);
router.get('/projects/create', requireAuth, requireApproved, checkProjectLimit, projectController.showCreateProject);
router.post('/projects/create', requireAuth, requireApproved, checkProjectLimit, validateProject, handleValidationErrors, projectController.createProject, incrementProjectCounter);
router.get('/projects/my', requireAuth, projectController.showMyProjects);
router.get('/projects/:id', projectController.showProjectDetail);
router.get('/projects/:id/responses', requireAuth, projectController.showProjectResponses);
router.post('/projects/:id/respond', requireAuth, requireApproved, checkResponseLimit, validateResponse, handleValidationErrors, projectController.submitResponse, incrementResponseCounter);
router.get('/projects/:id/edit', requireAuth, projectController.showEditProject);
router.post('/projects/:id/update', requireAuth, projectController.updateProject);
router.post('/projects/:id/close', requireAuth, projectController.closeProject);
router.post('/projects/:id/reveal/:responderId', requireAuth, projectController.revealIdentity);

// Review routes
router.get('/reviews/create', requireAuth, requireApproved, reviewController.showCreateReview);
router.post('/reviews/create', requireAuth, requireApproved, validateReview, handleValidationErrors, reviewController.createReview);
router.get('/reviews/my', requireAuth, reviewController.showMyReviews);

// Subscription routes (stubs for Stripe integration)
router.get('/subscriptions/checkout/:tier', requireAuth, (req, res) => {
  const tier = req.params.tier;
  
  // TODO: Integrate with Stripe for real payment processing
  // For now, this is a stub that simulates subscription upgrade
  
  req.flash('info', `Stripe integration placeholder: Upgrade to ${tier} tier. In production, this would redirect to Stripe Checkout.`);
  res.redirect('/dashboard');
});

module.exports = router;

module.exports = router;
