const Agency = require('../models/Agency');
const { Ticket, TicketResponse } = require('../models/Ticket');
const Project = require('../models/Project');
const Response = require('../models/Response');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');

// Show dashboard
exports.showDashboard = (req, res) => {
  const agency = Agency.findById(req.session.agencyId);
  const stats = Agency.getStats(req.session.agencyId);
  const recentProjects = Project.findByAgency(req.session.agencyId).slice(0, 5);

  res.render('pages/dashboard', {
    title: 'Dashboard',
    agency,
    stats,
    recentProjects,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Show profile edit form
exports.showEditProfile = (req, res) => {
  const agency = Agency.findById(req.session.agencyId);
  
  res.render('pages/edit-profile', {
    title: 'Edit Profile',
    agency,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle profile update
exports.updateProfile = (req, res) => {
  try {
    const {
      agency_name, contact_name, website, location,
      description, skills, platforms, verticals, certifications
    } = req.body;

    // Handle certifications: combine selected checkboxes and other text input
    let certs = [];
    if (Array.isArray(certifications)) {
      certs = certifications.filter(c => c); // Filter out empty strings
    } else if (typeof certifications === 'string' && certifications) {
      certs.push(certifications);
    }
    
    // The 'Other Certifications' text input is also passed in req.body.certifications
    // We assume the frontend will send an array of selected options + the 'other' text input
    // We will store the final array as a JSON string.
    // Add other certifications from text input
    const otherCerts = req.body.other_certifications || '';
    if (otherCerts.trim()) {
      const otherList = otherCerts.split(',').map(c => c.trim()).filter(c => c);
      certs = certs.concat(otherList);
    }
    
    // Remove duplicates and store as JSON string
    const uniqueCerts = [...new Set(certs)];
    const certificationsJson = JSON.stringify(uniqueCerts);

    Agency.update(req.session.agencyId, {
      agency_name,
      contact_name,
      website,
      location,
      description,
      skills,
      platforms,
      verticals,
      certifications: certificationsJson
    });

    ActivityLog.log('profile_updated', req.session.agencyId);

    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile/edit');
  } catch (error) {
    console.error('Profile update error:', error);
    req.flash('error', 'Failed to update profile');
    res.redirect('/profile/edit');
  }
};

// Show public agency profile
exports.showPublicProfile = (req, res) => {
  const agencyId = req.params.id;
  const agency = Agency.findById(agencyId);

  if (!agency || agency.status !== 'approved') {
    req.flash('error', 'Agency not found');
    return res.redirect('/projects');
  }

  const reviews = Review.findByTargetAgency(agencyId, 10);
  const projects = Project.findByAgency(agencyId).filter(p => p.status === 'open');

  // Parse badges
  const badges = agency.badges ? agency.badges.split(',').filter(b => b) : [];

  res.render('pages/agency-profile', {
    title: agency.agency_name,
    agency,
    reviews,
    projects,
    badges,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Show tickets list for agency
exports.showTickets = (req, res) => {
  const tickets = Ticket.getByAgency(req.session.agencyId);
  res.render('pages/my-tickets', {
    title: 'My Support Tickets',
    tickets,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Create new ticket
exports.createTicket = (req, res) => {
  try {
    const { title, category, message } = req.body;
    const agency_id = req.session.agencyId;

    if (!title || !category || !message) {
      req.flash('error', 'All fields are required to create a ticket.');
      return res.redirect('/support/tickets');
    }

    // 1. Create the ticket entry
    const ticketId = Ticket.create({ agency_id, title, category, status: 'open', message });
    
    // 2. Log the initial message as a response
    TicketResponse.create({
      ticket_id: ticketId,
      user_type: 'agency',
      user_id: agency_id,
      message,
    });

    req.flash('success', `Ticket #${ticketId} created successfully.`);
    res.redirect(`/support/tickets/${ticketId}`);
  } catch (error) {
    console.error('Create ticket error:', error);
    req.flash('error', 'Failed to create ticket. Please try again.');
    res.redirect('/support/tickets');
  }
};

// View single ticket and responses
exports.viewTicket = (req, res) => {
  const ticket = Ticket.getById(req.params.id);
  
  if (!ticket || ticket.agency_id !== req.session.agencyId) {
    req.flash('error', 'Ticket not found or access denied.');
    return res.redirect('/support/tickets');
  }

  const responses = TicketResponse.getByTicket(req.params.id);
  
  res.render('pages/view-ticket', {
    title: `Ticket #${ticket.id}`,
    ticket,
    responses,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Respond to ticket (Agency)
exports.respondToTicket = (req, res) => {
  try {
    const { message } = req.body;
    const ticketId = req.params.id;
    const agency_id = req.session.agencyId;

    const ticket = Ticket.getById(ticketId);
    if (!ticket || ticket.agency_id !== agency_id) {
      req.flash('error', 'Ticket not found or access denied.');
      return res.redirect('/support/tickets');
    }

    TicketResponse.create({
      ticket_id: ticketId,
      user_type: 'agency',
      user_id: agency_id,
      message,
    });
    
    // Re-open ticket if closed
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      Ticket.updateStatus(ticketId, 'open');
    }

    req.flash('success', 'Response sent.');
    res.redirect(`/support/tickets/${ticketId}`);
  } catch (error) {
    console.error('Respond to ticket error:', error);
    req.flash('error', 'Failed to send response.');
    res.redirect(`/support/tickets/${req.params.id}`);
  }
};
module.exports = exports;