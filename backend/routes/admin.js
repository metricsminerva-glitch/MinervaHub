const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// Admin auth routes
router.get('/login', adminController.showLogin);
router.post('/login', adminController.login);

// Admin dashboard
router.get('/dashboard', requireAdmin, adminController.showDashboard);

// Agency management
router.get('/agencies', requireAdmin, adminController.showAgencies);
router.post('/agencies/:id/approve', requireAdmin, adminController.approveAgency);
router.post('/agencies/:id/reject', requireAdmin, adminController.rejectAgency);
router.post('/agencies/:id/ban', requireAdmin, adminController.banAgency);
router.post('/agencies/:id/subscription', requireAdmin, adminController.updateSubscription);
router.post('/agencies/:id/update-plan', requireAdmin, adminController.updatePlanAndLimits);
router.post('/agencies/:id/unban', requireAdmin, adminController.unbanAgency);
router.post('/agencies/:id/delete', requireAdmin, adminController.deleteAgency);

// Project management
router.get('/projects', requireAdmin, adminController.showProjects);
router.post('/projects/:id/close', requireAdmin, adminController.closeProject);

// Response management
router.get('/responses', requireAdmin, adminController.showResponses);
router.post('/responses/:id/delete', requireAdmin, adminController.deleteResponse);

// Review management
router.get('/reviews', requireAdmin, adminController.showReviews);
router.post('/reviews/:id/delete', requireAdmin, adminController.deleteReview);

// Contact Messages
router.get('/contact-messages', requireAdmin, adminController.showContactMessages);
router.get('/contact-messages/:id', requireAdmin, adminController.viewContactMessage);

// Tickets
router.get('/tickets', requireAdmin, adminController.showTickets);
router.get('/tickets/:id', requireAdmin, adminController.viewTicket);
router.post('/tickets/:id/status', requireAdmin, adminController.updateTicketStatus);
router.post('/tickets/:id/respond', requireAdmin, adminController.respondToTicket);
router.post('/tickets/:id/delete', requireAdmin, adminController.deleteTicket);

// Admin logout
router.get('/logout', requireAdmin, adminController.logout);
module.exports = router;
