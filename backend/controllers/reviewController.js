const Review = require('../models/Review');
const Agency = require('../models/Agency');
const ActivityLog = require('../models/ActivityLog');

// Show create review form
exports.showCreateReview = (req, res) => {
  const targetAgencyId = parseInt(req.query.target);
  const projectId = req.query.project ? parseInt(req.query.project) : null;

  if (!targetAgencyId) {
    req.flash('error', 'Target agency not specified');
    return res.redirect('/projects');
  }

  const targetAgency = Agency.findById(targetAgencyId);
  if (!targetAgency) {
    req.flash('error', 'Agency not found');
    return res.redirect('/projects');
  }

  // Check if review already exists
  if (projectId) {
    const exists = Review.checkExists(req.session.agencyId, targetAgencyId, projectId);
    if (exists) {
      req.flash('error', 'You have already reviewed this agency for this project');
      return res.redirect(`/agencies/${targetAgencyId}`);
    }
  }

  res.render('pages/create-review', {
    title: `Review ${targetAgency.agency_name}`,
    targetAgency,
    projectId,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle review submission
exports.createReview = async (req, res) => {
  try {
    const { target_agency_id, project_id, rating, comment } = req.body;

    const targetAgencyId = parseInt(target_agency_id);
    const projectIdInt = project_id ? parseInt(project_id) : null;

    // Validate
    if (targetAgencyId === req.session.agencyId) {
      req.flash('error', 'You cannot review your own agency');
      return res.redirect('/projects');
    }

    // Check if review already exists
    if (projectIdInt) {
      const exists = Review.checkExists(req.session.agencyId, targetAgencyId, projectIdInt);
      if (exists) {
        req.flash('error', 'You have already reviewed this agency for this project');
        return res.redirect(`/agencies/${targetAgencyId}`);
      }
    }

    // Create review
    const reviewId = Review.create({
      reviewer_agency_id: req.session.agencyId,
      target_agency_id: targetAgencyId,
      project_id: projectIdInt,
      rating: parseInt(rating),
      comment
    });

    // Update target agency's rating
    Agency.updateRating(targetAgencyId);

    // Update badges
    Agency.updateBadges(targetAgencyId);

    ActivityLog.log('review_created', req.session.agencyId, {
      review_id: reviewId,
      target_agency_id: targetAgencyId,
      rating
    });

    req.flash('success', 'Review submitted successfully');
    res.redirect(`/agencies/${targetAgencyId}`);
  } catch (error) {
    console.error('Review creation error:', error);
    req.flash('error', 'Failed to submit review');
    res.redirect('/projects');
  }
};

// Show reviews received by current agency
exports.showMyReviews = (req, res) => {
  const reviews = Review.findByTargetAgency(req.session.agencyId);
  const agency = Agency.findById(req.session.agencyId);

  res.render('pages/my-reviews', {
    title: 'Reviews Received',
    reviews,
    agency,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

module.exports = exports;
