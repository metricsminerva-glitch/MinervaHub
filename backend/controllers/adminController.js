const bcrypt = require('bcrypt');
const AdminUser = require('../models/AdminUser');
const Agency = require('../models/Agency');
const ContactMessage = require('../models/ContactMessage');
const { Ticket, TicketResponse } = require('../models/Ticket');
const Project = require('../models/Project');
const Response = require('../models/Response');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');
const db = require('../models/db');

// Show admin login form
exports.showLogin = (req, res) => {
  res.render('pages/admin-login', {
    title: 'Admin Login'
  });
};

// Handle admin login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = AdminUser.findByEmail(email);
    if (!admin) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/admin/login');
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/admin/login');
    }

    req.session.adminId = admin.id;
    ActivityLog.log('admin_login', null, { admin_email: email });

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Admin login error:', error);
    req.flash('error', 'Login failed');
    res.redirect('/admin/login');
  }
};

// Show admin dashboard
exports.showDashboard = (req, res) => {
  const stats = {
    agencies: db.prepare('SELECT COUNT(*) as count FROM agencies').get().count,
    pendingAgencies: db.prepare('SELECT COUNT(*) as count FROM agencies WHERE status = ?').get('pending').count,
    projects: db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
    openProjects: db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('open').count,
    responses: db.prepare('SELECT COUNT(*) as count FROM responses').get().count,
    reviews: db.prepare('SELECT COUNT(*) as count FROM reviews').get().count,
    contactMessages: ContactMessage.getUnreadCount(),
    openTickets: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
  };

  const recentActivity = ActivityLog.getRecent(20);

  res.render('pages/admin-dashboard', {
    title: 'Admin Dashboard',
    stats,
    recentActivity,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Show agencies list
exports.showAgencies = (req, res) => {
  const Plan = require('../models/Plan');
  const statusFilter = req.query.status || null;
  const agencies = Agency.findAll({ status: statusFilter });
  const plans = Plan.getAll();

  res.render('pages/admin-agencies', {
    title: 'Manage Agencies',
    agencies,
    plans,
    statusFilter,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Approve agency
exports.approveAgency = (req, res) => {
  try {
    const agencyId = req.params.id;
    Agency.update(agencyId, { status: 'approved' });
    
    ActivityLog.log('agency_approved', agencyId, { admin_id: req.session.adminId });

    req.flash('success', 'Agency approved');
    res.redirect('/admin/agencies');
  } catch (error) {
    console.error('Approve agency error:', error);
    req.flash('error', 'Failed to approve agency');
    res.redirect('/admin/agencies');
  }
};

// Reject agency
exports.rejectAgency = (req, res) => {
  try {
    const agencyId = req.params.id;
    Agency.update(agencyId, { status: 'rejected' });
    
    ActivityLog.log('agency_rejected', agencyId, { admin_id: req.session.adminId });

    req.flash('success', 'Agency rejected');
    res.redirect('/admin/agencies');
  } catch (error) {
    console.error('Reject agency error:', error);
    req.flash('error', 'Failed to reject agency');
    res.redirect('/admin/agencies');
  }
};

// Ban agency
exports.banAgency = (req, res) => {
  try {
    const agencyId = req.params.id;
    Agency.update(agencyId, { status: 'banned' });
    
    ActivityLog.log('agency_banned', agencyId, { admin_id: req.session.adminId });

    req.flash('success', 'Agency banned');
    res.redirect('/admin/agencies');
  } catch (error) {
    console.error('Ban agency error:', error);
    req.flash('error', 'Failed to ban agency');
    res.redirect('/admin/agencies');
  }
};

// Update agency subscription
exports.updateSubscription = (req, res) => {
  try {
    const agencyId = req.params.id;
    const { subscription_tier } = req.body;

    Agency.update(agencyId, { 
      subscription_tier,
      subscription_status: 'active'
    });

    // Update badges based on new tier
    Agency.updateBadges(agencyId);
    
    ActivityLog.log('subscription_updated', agencyId, { 
      admin_id: req.session.adminId,
      new_tier: subscription_tier 
    });

    req.flash('success', 'Subscription updated');
    res.redirect('/admin/agencies');
  } catch (error) {
    console.error('Update subscription error:', error);
    req.flash('error', 'Failed to update subscription');
    res.redirect('/admin/agencies');
  }
};

// Show projects list
exports.showProjects = (req, res) => {
  const projects = Project.findAll({});

  res.render('pages/admin-projects', {
    title: 'Manage Projects',
    projects,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Close project
exports.closeProject = (req, res) => {
  try {
    const projectId = req.params.id;
    Project.update(projectId, { status: 'closed' });
    
    ActivityLog.log('project_closed_by_admin', null, { 
      admin_id: req.session.adminId,
      project_id: projectId 
    });

    req.flash('success', 'Project closed');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Close project error:', error);
    req.flash('error', 'Failed to close project');
    res.redirect('/admin/projects');
  }
};

// Show responses list
exports.showResponses = (req, res) => {
  const responses = Response.findAll({});

  res.render('pages/admin-responses', {
    title: 'Manage Responses',
    responses,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Delete response
exports.deleteResponse = (req, res) => {
  try {
    const responseId = req.params.id;
    Response.delete(responseId);
    
    ActivityLog.log('response_deleted_by_admin', null, { 
      admin_id: req.session.adminId,
      response_id: responseId 
    });

    req.flash('success', 'Response deleted');
    res.redirect('/admin/responses');
  } catch (error) {
    console.error('Delete response error:', error);
    req.flash('error', 'Failed to delete response');
    res.redirect('/admin/responses');
  }
};

// Show reviews list
exports.showReviews = (req, res) => {
  const reviews = Review.findAll({});

  res.render('pages/admin-reviews', {
    title: 'Manage Reviews',
    reviews,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Delete review
exports.deleteReview = (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = Review.findById(reviewId);
    
    Review.delete(reviewId);
    
    // Recalculate target agency rating
    if (review) {
      Agency.updateRating(review.target_agency_id);
      Agency.updateBadges(review.target_agency_id);
    }
    
    ActivityLog.log('review_deleted_by_admin', null, { 
      admin_id: req.session.adminId,
      review_id: reviewId 
    });

    req.flash('success', 'Review deleted');
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'Failed to delete review');
    res.redirect('/admin/reviews');
  }
};

// Show contact messages list
exports.showContactMessages = (req, res) => {
  const messages = ContactMessage.getAll();
  res.render('pages/admin-contact-messages', {
    title: 'Contact Messages',
    messages,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// View contact message and mark as read
exports.viewContactMessage = (req, res) => {
  const message = ContactMessage.getById(req.params.id);
  if (message) {
    ContactMessage.markAsRead(req.params.id);
    res.render('pages/admin-view-contact-message', {
      title: 'View Message',
      message,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } else {
    req.flash('error', 'Message not found.');
    res.redirect('/admin/contact-messages');
  }
};

// Show tickets list
exports.showTickets = (req, res) => {
  const tickets = Ticket.getAll();
  res.render('pages/admin-tickets', {
    title: 'Manage Tickets',
    tickets,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// View ticket and responses
exports.viewTicket = (req, res) => {
  const ticket = Ticket.getById(req.params.id);
  if (ticket) {
    const responses = TicketResponse.getByTicket(req.params.id);
    const agency = Agency.findById(ticket.agency_id); // Fetch agency details
    res.render('pages/admin-view-ticket', {
      title: `Ticket #${ticket.id}`,
      ticket,
      responses,
      agency, // Pass agency details to the view
      error: req.flash('error'),
      success: req.flash('success')
    });
  } else {
    req.flash('error', 'Ticket not found.');
    res.redirect('/admin/tickets');
  }
};

// Update ticket status
exports.updateTicketStatus = (req, res) => {
  try {
    const { status } = req.body;
    Ticket.updateStatus(req.params.id, status);
    req.flash('success', `Ticket #${req.params.id} status updated to ${status}.`);
    res.redirect(`/admin/tickets/${req.params.id}`);
  } catch (error) {
    console.error('Update ticket status error:', error);
    req.flash('error', 'Failed to update ticket status');
    res.redirect(`/admin/tickets/${req.params.id}`);
  }
};

// Respond to ticket (Admin)
exports.respondToTicket = (req, res) => {
  try {
    const { message } = req.body;
    const ticketId = req.params.id;
    
    TicketResponse.create({
      ticket_id: ticketId,
      user_type: 'admin',
      user_id: req.session.adminId,
      message,
    });
    
    // Set ticket status to in_progress if it was open
    const ticket = Ticket.getById(ticketId);
    if (ticket.status === 'open') {
      Ticket.updateStatus(ticketId, 'in_progress');
    }
    
    req.flash('success', 'Response sent.');
    res.redirect(`/admin/tickets/${ticketId}`);
  } catch (error) {
    console.error('Respond to ticket error:', error);
    req.flash('error', 'Failed to send response');
    res.redirect(`/admin/tickets/${req.params.id}`);
  }
};

// Delete ticket
exports.deleteTicket = (req, res) => {
  try {
    const ticketId = req.params.id;
    Ticket.delete(ticketId);
    
    ActivityLog.log('ticket_deleted_by_admin', null, { 
      admin_id: req.session.adminId,
      ticket_id: ticketId 
    });

    req.flash('success', 'Ticket and all associated responses deleted.');
    res.redirect('/admin/tickets');
  } catch (error) {
    console.error('Delete ticket error:', error);
    req.flash('error', 'Failed to delete ticket');
    res.redirect('/admin/tickets');
  }
};

// Update agency plan and limits
exports.updatePlanAndLimits = (req, res) => {
  try {
    const agencyId = req.params.id;
    const { plan_id, custom_max_projects, custom_max_responses } = req.body;
    
    const updateData = {
      plan_id: parseInt(plan_id)
    };
    
    // Only set custom limits if they have values
    if (custom_max_projects && custom_max_projects !== '') {
      updateData.custom_max_projects = parseInt(custom_max_projects);
    } else {
      updateData.custom_max_projects = null;
    }
    
    if (custom_max_responses && custom_max_responses !== '') {
      updateData.custom_max_responses = parseInt(custom_max_responses);
    } else {
      updateData.custom_max_responses = null;
    }
    
    Agency.update(agencyId, updateData);
    
    ActivityLog.log('agency_plan_updated', agencyId, { 
      admin_id: req.session.adminId,
      plan_id,
      custom_max_projects: updateData.custom_max_projects,
      custom_max_responses: updateData.custom_max_responses
    });
    
    req.flash('success', 'Plan and limits updated successfully');
    res.redirect('/admin/agencies');
  } catch (error) {
    console.error('Update plan error:', error);
    req.flash('error', 'Failed to update plan and limits');
    res.redirect('/admin/agencies');
  }
};

// Unban agency
exports.unbanAgency = (req, res) => {
  try {
    const agencyId = req.params.id;
    Agency.update(agencyId, { status: 'approved' });
    
    ActivityLog.log('agency_unbanned', agencyId, { admin_id: req.session.adminId });
    
    req.flash('success', 'Agency unbanned successfully');
    res.redirect('/admin/agencies');
  } catch (error) {
    console.error('Unban agency error:', error);
    req.flash('error', 'Failed to unban agency');
    res.redirect('/admin/agencies');
  }
};

// Delete agency
exports.deleteAgency = (req, res) => {
  try {
    const agencyId = req.params.id;
    Agency.delete(agencyId);
    
    ActivityLog.log('agency_deleted', agencyId, { admin_id: req.session.adminId });
    
    req.flash('success', 'Agency deleted successfully');
    res.redirect('/admin/agencies');
  } catch (error) {
    console.error('Delete agency error:', error);
    req.flash('error', 'Failed to delete agency');
    res.redirect('/admin/agencies');
  }
};

// Admin logout
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

module.exports = exports;
