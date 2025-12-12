const bcrypt = require('bcrypt');
const Agency = require('../models/Agency');
const ContactMessage = require('../models/ContactMessage');
const ActivityLog = require('../models/ActivityLog');

// Show registration form
exports.showRegister = (req, res) => {
  res.render('pages/register', { 
    title: 'Register Your Agency',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle registration
exports.register = async (req, res) => {
  try {
    const {
      agency_name, contact_name, email, password,
      website, location, description, skills, platforms, verticals
    } = req.body;

    // Check if email already exists
    const existing = Agency.findByEmail(email);
    if (existing) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create agency
    const agencyId = Agency.create({
      agency_name,
      contact_name,
      email,
      password_hash,
      website,
      location,
      description,
      skills,
      platforms,
      verticals,
      status: 'pending',
      subscription_tier: 'free',
      subscription_status: 'active'
    });

    // Log activity
    ActivityLog.log('agency_registered', agencyId, { email, agency_name });

    req.flash('success', 'Registration successful! Your profile is pending approval.');
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/register');
  }
};

// Show login form
exports.showLogin = (req, res) => {
  res.render('pages/login', {
    title: 'Login'
  });
};

// Handle login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const agency = Agency.findByEmail(email);
    if (!agency) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Check password
    const validPassword = await bcrypt.compare(password, agency.password_hash);
    if (!validPassword) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Set session
    req.session.agencyId = agency.id;
    req.session.agencyStatus = agency.status;

    // Log activity
    ActivityLog.log('agency_login', agency.id, { email });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/login');
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

// Handle contact form submission
exports.submitContactForm = (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/contact');
    }

    ContactMessage.create({ name, email, subject, message });
    
    req.flash('success', 'Your message has been sent! We will get back to you shortly.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form submission error:', error);
    req.flash('error', 'Failed to send message. Please try again.');
    res.redirect('/contact');
  }
};

module.exports = exports;
