/**
 * RBAC permission catalog — resource:action
 * Roles compose these; services enforce them.
 */

export const PERMISSIONS = {
  // Dashboard
  "dashboard:view": { group: "dashboard", description: "View admin dashboard" },

  // Properties
  "property:read": { group: "property", description: "View properties" },
  "property:create": { group: "property", description: "Create properties" },
  "property:update": { group: "property", description: "Update properties" },
  "property:delete": { group: "property", description: "Soft-delete properties" },
  "property:publish": { group: "property", description: "Publish / unpublish" },
  "property:bulk": { group: "property", description: "Bulk property actions" },
  "property:sync": { group: "property", description: "Run provider sync" },

  // Catalog
  "developer:manage": { group: "catalog", description: "Manage developers" },
  "agent:manage": { group: "catalog", description: "Manage sales agents" },
  "location:manage": { group: "catalog", description: "Manage geo entities" },
  "amenity:manage": { group: "catalog", description: "Manage amenities" },

  // Leads / CRM
  "lead:read": { group: "lead", description: "View leads" },
  "lead:update": { group: "lead", description: "Update lead status / assignment" },
  "lead:assign": { group: "lead", description: "Assign leads" },
  "lead:crm_retry": { group: "lead", description: "Retry LeadRat sync" },
  "lead:export": { group: "lead", description: "Export leads" },

  // CMS / Builders
  "cms:page": { group: "cms", description: "Manage static pages" },
  "cms:homepage": { group: "cms", description: "Homepage builder" },
  "cms:landing": { group: "cms", description: "Landing page builder" },
  "cms:blog": { group: "cms", description: "Blog CMS" },
  "cms:form": { group: "cms", description: "Form builder" },
  "cms:menu": { group: "cms", description: "Navigation menus" },
  "cms:seo": { group: "cms", description: "SEO manager" },
  "cms:workflow": { group: "cms", description: "Submit / approve content" },
  "cms:publish": { group: "cms", description: "Final publish approval" },

  // Media
  "media:read": { group: "media", description: "Browse media library" },
  "media:upload": { group: "media", description: "Upload media" },
  "media:delete": { group: "media", description: "Delete media" },

  // Agent portal
  "portal:access": {
    group: "portal",
    description: "Access the agent portal",
  },
  "portal:profile": {
    group: "portal",
    description: "Submit changes to own agent profile",
  },
  "portal:property": {
    group: "portal",
    description: "Submit own property listings for review",
  },
  "portal:blog": {
    group: "portal",
    description: "Submit own blog posts for review",
  },
  "submission:review": {
    group: "portal",
    description: "Approve or reject portal submissions",
  },

  // Users / RBAC
  "user:manage": { group: "iam", description: "Manage users" },
  "role:manage": { group: "iam", description: "Manage roles & permissions" },

  // System
  "settings:manage": { group: "system", description: "Website settings" },
  "analytics:view": { group: "system", description: "View analytics" },
  "activity:view": { group: "system", description: "View activity logs" },
  "notification:manage": { group: "system", description: "Manage notifications" },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const ROLE_SLUGS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  PROPERTY_MANAGER: "property_manager",
  CONTENT_EDITOR: "content_editor",
  SALES_AGENT: "sales_agent",
  VIEWER: "viewer",
} as const;

export type RoleSlug = (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS];

/** Default permission sets per system role */
export const ROLE_PERMISSIONS: Record<RoleSlug, PermissionKey[]> = {
  super_admin: Object.keys(PERMISSIONS) as PermissionKey[],
  admin: [
    "dashboard:view",
    "property:read",
    "property:create",
    "property:update",
    "property:delete",
    "property:publish",
    "property:bulk",
    "property:sync",
    "developer:manage",
    "agent:manage",
    "location:manage",
    "amenity:manage",
    "lead:read",
    "lead:update",
    "lead:assign",
    "lead:crm_retry",
    "lead:export",
    "cms:page",
    "cms:homepage",
    "cms:landing",
    "cms:blog",
    "cms:form",
    "cms:menu",
    "cms:seo",
    "cms:workflow",
    "cms:publish",
    "media:read",
    "media:upload",
    "media:delete",
    "user:manage",
    "settings:manage",
    "analytics:view",
    "activity:view",
    "notification:manage",
  ],
  property_manager: [
    "dashboard:view",
    "property:read",
    "property:create",
    "property:update",
    "property:publish",
    "property:bulk",
    "property:sync",
    "developer:manage",
    "agent:manage",
    "location:manage",
    "amenity:manage",
    "media:read",
    "media:upload",
    "analytics:view",
  ],
  content_editor: [
    "dashboard:view",
    "cms:page",
    "cms:homepage",
    "cms:landing",
    "cms:blog",
    "cms:form",
    "cms:menu",
    "cms:seo",
    "cms:workflow",
    "media:read",
    "media:upload",
  ],
  // Portal-only role: everything an agent submits is reviewed before it goes
  // live, so no publish or dashboard permissions here.
  sales_agent: [
    "portal:access",
    "portal:profile",
    "portal:property",
    "portal:blog",
    "lead:read",
    "lead:update",
    "property:read",
    "media:read",
    "media:upload",
    "notification:manage",
  ],
  viewer: ["dashboard:view", "property:read", "lead:read", "analytics:view"],
};
