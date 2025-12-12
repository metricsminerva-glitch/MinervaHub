const Project = require('../models/Project');
const Response = require('../models/Response');
const Agency = require('../models/Agency');
const ProjectIdentityReveal = require('../models/ProjectIdentityReveal');
const ActivityLog = require('../models/ActivityLog');

// Helper function to determine the agency name and logo to display
const getProjectAgencyDisplay = (project, currentAgencyId, req) => {
  const isOwner = currentAgencyId && currentAgencyId === project.agency_id;
  const isRevealed = ProjectIdentityReveal.isRevealed(project.id, currentAgencyId);
  const isAdmin = req && req.session && req.session.isAdmin; // Assuming admin session is set

  if (project.hide_identity === 0 || isOwner || isAdmin || isRevealed) {
    return {
      agency_name: project.agency_name,
      agency_id: project.agency_id,
      logo_url: project.logo_url, // Assuming logo_url is available on project object
      is_hidden: false
    };
  } else {
    return {
      agency_name: 'Agency Hidden',
      agency_id: null,
      logo_url: '/img/placeholder-logo.png', // Placeholder logo
      is_hidden: true
    };
  }
};

// Show all projects (marketplace)
exports.showProjects = (req, res) => {
  const { platform, type } = req.query;
  const currentAgencyId = req.session.agencyId;
  
  const filters = { status: 'open' };
  if (platform) filters.platform = platform;
  if (type) filters.project_type = type;

  let projects = Project.findAll(filters);

  // Apply identity hiding logic
  projects = projects.map(project => {
    const display = getProjectAgencyDisplay(project, currentAgencyId, req);
    return {
      ...project,
      agency_name: display.agency_name,
      agency_id: display.agency_id,
      logo_url: display.logo_url,
      is_hidden: display.is_hidden
    };
  });

  res.render('pages/projects', {
    title: 'Project Marketplace',
    projects,
    selectedPlatform: platform || '',
    selectedType: type || '',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Show single project detail
exports.showProjectDetail = (req, res) => {
  const projectId = req.params.id;
  const currentAgencyId = req.session.agencyId;
  let project = Project.findById(projectId);

  if (!project) {
    req.flash('error', 'Project not found');
    return res.redirect('/projects');
  }

  const responses = Response.findByProject(projectId);
  const responseCount = responses.length;

  // Check if current user is the project owner
  const isOwner = currentAgencyId && currentAgencyId === project.agency_id;

  // Apply identity hiding logic
  const display = getProjectAgencyDisplay(project, currentAgencyId, req);
  project = {
    ...project,
    agency_name: display.agency_name,
    agency_id: display.agency_id,
    logo_url: display.logo_url,
    is_hidden: display.is_hidden
  };

  // For the owner, fetch the identity reveal status for all responders
  let responsesWithRevealStatus = [];
  if (isOwner) {
    responsesWithRevealStatus = responses.map(response => {
      const isRevealed = ProjectIdentityReveal.isRevealed(projectId, response.responder_agency_id);
      return {
        ...response,
        is_revealed: isRevealed
      };
    });
  }

  res.render('pages/project-detail', {
    title: project.title,
    project,
    responses: isOwner ? responsesWithRevealStatus : [],
    responseCount,
    isOwner,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Show create project form
exports.showCreateProject = (req, res) => {
  const agency = Agency.findById(req.session.agencyId);

  res.render('pages/create-project', {
    title: 'Create Project',
    agency,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle project creation
exports.createProject = (req, res) => {
  try {
    const Agency = require('../models/Agency');
    const Plan = require('../models/Plan');
    
    // Get user and their plan
    const agency = Agency.getById(req.session.agencyId);
    const plan = Plan.getById(agency.plan_id);
    
    // Check current project count this month
    const currentProjects = agency.projects_created_this_month || 0;
    
    // Determine effective limit (custom override or plan limit)
    const maxProjects = agency.custom_max_projects !== null ? agency.custom_max_projects : plan.max_projects;
    
    // Check if limit reached (-1 means unlimited)
    if (maxProjects !== -1 && currentProjects >= maxProjects) {
      req.flash('error', 'You have reached the limit of your current plan.');
      return res.redirect('/projects/create');
    }
    
    const {
      title, description, project_type,
      platforms_involved, budget_range, deadline, hide_identity
    } = req.body;

    const projectId = Project.create({
      agency_id: req.session.agencyId,
      title,
      description,
      project_type,
      platforms_involved,
      budget_range,
      deadline: deadline || null,
      hide_identity: hide_identity ? 1 : 0,
      status: 'open'
    });

    // Increment monthly project counter
    Agency.update(req.session.agencyId, {
      projects_created_this_month: currentProjects + 1
    });
    
    ActivityLog.log('project_created', req.session.agencyId, { project_id: projectId, title });

    req.flash('success', 'Project created successfully');
    res.redirect(`/projects/${projectId}`);
  } catch (error) {
    console.error('Project creation error:', error);
    req.flash('error', 'Failed to create project');
    res.redirect('/projects/create');
  }
};

// Show user's projects
exports.showMyProjects = (req, res) => {
  const projects = Project.findByAgency(req.session.agencyId);

  res.render('pages/my-projects', {
    title: 'My Projects',
    projects,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Show responses for a project
exports.showProjectResponses = (req, res) => {
  const projectId = req.params.id;
  const project = Project.findById(projectId);

  if (!project || project.agency_id !== req.session.agencyId) {
    req.flash('error', 'Access denied');
    return res.redirect('/projects/my');
  }

  const responses = Response.findByProject(projectId);

  // For the owner, fetch the identity reveal status for all responders
  const responsesWithRevealStatus = responses.map(response => {
    const isRevealed = ProjectIdentityReveal.isRevealed(projectId, response.responder_agency_id);
    return {
      ...response,
      is_revealed: isRevealed
    };
  });

  res.render('pages/project-responses', {
    title: `Responses: ${project.title}`,
    project,
    responses: responsesWithRevealStatus,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle project response submission
exports.submitResponse = (req, res) => {
  try {
    const Agency = require('../models/Agency');
    const Plan = require('../models/Plan');
    
    const projectId = req.params.id;
    const { message, contact_email } = req.body;

    const project = Project.findById(projectId);
    if (!project) {
      req.flash('error', 'Project not found');
      return res.redirect('/projects');
    }

    // Check if user is not the project owner
    if (project.agency_id === req.session.agencyId) {
      req.flash('error', 'You cannot respond to your own project');
      return res.redirect(`/projects/${projectId}`);
    }
    
    // Get user and their plan
    const agency = Agency.getById(req.session.agencyId);
    const plan = Plan.getById(agency.plan_id);
    
    // Check current response count this month
    const currentResponses = agency.responses_sent_this_month || 0;
    
    // Determine effective limit (custom override or plan limit)
    const maxResponses = agency.custom_max_responses !== null ? agency.custom_max_responses : plan.max_responses;
    
    // Check if limit reached (-1 means unlimited)
    if (maxResponses !== -1 && currentResponses >= maxResponses) {
      req.flash('error', 'You have reached the limit of your current plan.');
      return res.redirect(`/projects/${projectId}?showUpgrade=true`);
    }

    Response.create({
      project_id: projectId,
      responder_agency_id: req.session.agencyId,
      message,
      contact_email
    });

    // Increment monthly response counter
    Agency.update(req.session.agencyId, {
      responses_sent_this_month: currentResponses + 1
    });
    
    ActivityLog.log('response_sent', req.session.agencyId, { 
      project_id: projectId,
      project_title: project.title 
    });

    req.flash('success', 'Response sent successfully');
    res.redirect(`/projects/${projectId}`);
  } catch (error) {
    console.error('Response submission error:', error);
    req.flash('error', 'Failed to submit response');
    res.redirect(`/projects/${req.params.id}`);
  }
};

// Handle identity reveal toggle
exports.revealIdentity = (req, res) => {
  try {
    const projectId = req.params.id;
    const responderAgencyId = parseInt(req.params.responderId);
    const project = Project.findById(projectId);

    if (!project || project.agency_id !== req.session.agencyId) {
      req.flash('error', 'Access denied');
      return res.redirect('/projects/my');
    }

    if (project.hide_identity === 0) {
      req.flash('error', 'Identity is already public for this project.');
      return res.redirect(`/projects/${projectId}/responses`);
    }

    ProjectIdentityReveal.create(projectId, responderAgencyId);

    ActivityLog.log('identity_revealed', req.session.agencyId, { 
      project_id: projectId,
      responder_agency_id: responderAgencyId
    });

    req.flash('success', 'Identity revealed to the selected agency.');
    res.redirect(`/projects/${projectId}/responses`);
  } catch (error) {
    console.error('Reveal identity error:', error);
    req.flash('error', 'Failed to reveal identity.');
    res.redirect(`/projects/${req.params.id}/responses`);
  }
};

// Show edit project form
exports.showEditProject = (req, res) => {
  try {
    const projectId = req.params.id;
    const project = Project.findById(projectId);

    if (!project) {
      req.flash('error', 'Project not found');
      return res.redirect('/projects/my');
    }

    if (project.agency_id !== req.session.agencyId) {
      req.flash('error', 'Access denied');
      return res.redirect('/projects/my');
    }

    res.render('pages/edit-project', {
      title: 'Edit Project',
      project,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Show edit project error:', error);
    req.flash('error', 'Failed to load project');
    res.redirect('/projects/my');
  }
};

// Handle project update
exports.updateProject = (req, res) => {
  try {
    const projectId = req.params.id;
    const project = Project.findById(projectId);

    if (!project) {
      req.flash('error', 'Project not found');
      return res.redirect('/projects/my');
    }

    if (project.agency_id !== req.session.agencyId) {
      req.flash('error', 'Access denied');
      return res.redirect('/projects/my');
    }

    const {
      title, description, project_type,
      platforms_involved, budget_range, deadline, hide_identity
    } = req.body;

    Project.update(projectId, {
      title,
      description,
      project_type,
      platforms_involved,
      budget_range,
      deadline: deadline || null,
      hide_identity: hide_identity ? 1 : 0
    });

    ActivityLog.log('project_updated', req.session.agencyId, { project_id: projectId, title });

    req.flash('success', 'Project updated successfully');
    res.redirect(`/projects/${projectId}`);
  } catch (error) {
    console.error('Project update error:', error);
    req.flash('error', 'Failed to update project');
    res.redirect(`/projects/${req.params.id}/edit`);
  }
};

// Close a project
exports.closeProject = (req, res) => {
  try {
    const projectId = req.params.id;
    const project = Project.findById(projectId);

    if (!project || project.agency_id !== req.session.agencyId) {
      req.flash('error', 'Access denied');
      return res.redirect('/projects/my');
    }

    Project.update(projectId, { status: 'closed' });

    ActivityLog.log('project_closed', req.session.agencyId, { project_id: projectId });

    req.flash('success', 'Project closed successfully');
    res.redirect('/projects/my');
  } catch (error) {
    console.error('Project close error:', error);
    req.flash('error', 'Failed to close project');
    res.redirect('/projects/my');
  }
};

module.exports = exports;
