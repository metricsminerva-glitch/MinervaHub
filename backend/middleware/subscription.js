const Agency = require('../models/Agency');
const Project = require('../models/Project');
const Response = require('../models/Response');

// Check if agency can create projects based on subscription tier
function checkProjectLimit(req, res, next) {
  if (!req.session.agencyId) {
    return res.redirect('/login');
  }

  const agency = Agency.findById(req.session.agencyId);

  if (!agency) {
    return res.redirect('/login');
  }

  // Pro and premium have unlimited projects
  if (agency.subscription_tier === 'pro' || agency.subscription_tier === 'premium') {
    return next();
  }

  // Free tier: 1 project per month
  if (agency.subscription_tier === 'free') {
    if (agency.projects_created_this_month >= 1) {
      req.flash('error', 'You have reached your monthly project limit. Upgrade to Pro or Premium for unlimited projects.');
      return res.redirect('/dashboard');
    }
  }

  next();
}

// Check if agency can send responses based on subscription tier
function checkResponseLimit(req, res, next) {
  if (!req.session.agencyId) {
    return res.redirect('/login');
  }

  const agency = Agency.findById(req.session.agencyId);

  if (!agency) {
    return res.redirect('/login');
  }

  // Pro and premium have unlimited responses
  if (agency.subscription_tier === 'pro' || agency.subscription_tier === 'premium') {
    return next();
  }

  // Free tier: 5 responses per month
  if (agency.subscription_tier === 'free') {
    if (agency.responses_sent_this_month >= 5) {
      req.flash('error', 'You have reached your monthly response limit. Upgrade to Pro or Premium for unlimited responses.');
      return res.redirect('/dashboard');
    }
  }

  next();
}

// Increment project counter after creation
function incrementProjectCounter(req, res, next) {
  if (req.session.agencyId) {
    const agency = Agency.findById(req.session.agencyId);
    if (agency && agency.subscription_tier === 'free') {
      Agency.update(req.session.agencyId, {
        projects_created_this_month: agency.projects_created_this_month + 1
      });
    }
  }
  next();
}

// Increment response counter after creation
function incrementResponseCounter(req, res, next) {
  if (req.session.agencyId) {
    const agency = Agency.findById(req.session.agencyId);
    if (agency && agency.subscription_tier === 'free') {
      Agency.update(req.session.agencyId, {
        responses_sent_this_month: agency.responses_sent_this_month + 1
      });
    }
  }
  next();
}

module.exports = {
  checkProjectLimit,
  checkResponseLimit,
  incrementProjectCounter,
  incrementResponseCounter
};
