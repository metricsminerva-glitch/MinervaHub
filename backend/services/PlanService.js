const Plan = require('../models/Plan');
const UserOverride = require('../models/UserOverride');
const Agency = require('../models/Agency');

class PlanService {
  /**
   * Get effective limits for a user (considering overrides)
   */
  static getEffectiveLimits(userId) {
    // Check for expired overrides first
    UserOverride.checkAndExpireOverrides();
    
    // Get user's override if exists
    const override = UserOverride.getByUserId(userId);
    
    if (override) {
      // If override has a plan, get that plan
      let basePlan = null;
      if (override.override_plan_id) {
        basePlan = Plan.getById(override.override_plan_id);
      }
      
      // If no override plan, get user's current plan
      if (!basePlan) {
        const user = Agency.getById(userId);
        basePlan = Plan.getByName(user.subscription_tier) || Plan.getDefault();
      }
      
      // Apply custom overrides
      return {
        max_projects: override.custom_max_projects !== null ? override.custom_max_projects : basePlan.max_projects,
        max_responses: override.custom_max_responses !== null ? override.custom_max_responses : basePlan.max_responses,
        max_collabs: override.custom_max_collabs !== null ? override.custom_max_collabs : basePlan.max_collabs,
        max_messages: override.custom_max_messages !== null ? override.custom_max_messages : basePlan.max_messages,
        badge_label: override.custom_badge_label || basePlan.highlight_label,
        badge_color: override.custom_badge_color || basePlan.highlight_badge_color,
        plan_name: basePlan.name,
        is_override: true
      };
    }
    
    // No override, get user's plan
    const user = Agency.getById(userId);
    const plan = Plan.getByName(user.subscription_tier) || Plan.getDefault();
    
    return {
      max_projects: plan.max_projects,
      max_responses: plan.max_responses,
      max_collabs: plan.max_collabs,
      max_messages: plan.max_messages,
      badge_label: plan.highlight_label,
      badge_color: plan.highlight_badge_color,
      plan_name: plan.name,
      is_override: false
    };
  }

  /**
   * Check if user can perform an action based on limits
   */
  static canPerformAction(userId, action, currentCount) {
    const limits = this.getEffectiveLimits(userId);
    
    let maxAllowed;
    switch (action) {
      case 'create_project':
        maxAllowed = limits.max_projects;
        break;
      case 'send_response':
        maxAllowed = limits.max_responses;
        break;
      case 'create_collab':
        maxAllowed = limits.max_collabs;
        break;
      case 'send_message':
        maxAllowed = limits.max_messages;
        break;
      default:
        return { allowed: false, reason: 'Unknown action' };
    }
    
    // -1 means unlimited
    if (maxAllowed === -1) {
      return { allowed: true, limit: 'unlimited', current: currentCount };
    }
    
    if (currentCount >= maxAllowed) {
      return { 
        allowed: false, 
        reason: `You have reached the limit of your current plan (${maxAllowed} ${action.replace('_', ' ')}s per month)`,
        limit: maxAllowed,
        current: currentCount
      };
    }
    
    return { 
      allowed: true, 
      limit: maxAllowed, 
      current: currentCount,
      remaining: maxAllowed - currentCount
    };
  }

  /**
   * Get plan badge for user
   */
  static getUserPlanBadge(userId) {
    const limits = this.getEffectiveLimits(userId);
    
    if (limits.badge_label) {
      return {
        label: limits.badge_label,
        color: limits.badge_color || '#6366f1'
      };
    }
    
    return null;
  }
}

module.exports = PlanService;
