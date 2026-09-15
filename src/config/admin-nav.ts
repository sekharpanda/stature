import {
  Activity,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CalendarCheck,
  ChartColumn,
  ChartPie,
  CircleQuestionMark,
  ClipboardList,
  Database,
  FileJson2,
  FileText,
  Gauge,
  Handshake,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Map,
  MapPin,
  Menu,
  Megaphone,
  Plug,
  Plus,
  Quote,
  RefreshCw,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { PermissionKey } from "@/constants/permissions";

/** Counters resolved server-side and injected into the sidebar. */
export type NavBadgeKey =
  | "propertiesDraft"
  | "propertiesFeatured"
  | "propertiesManual"
  | "propertiesLeadrat"
  | "leadsNew"
  | "leadsFollowUp"
  | "leadsMeeting"
  | "leadsTotal"
  | "crmPending"
  | "notificationsUnread"
  | "submissionsPending";

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  badgeKey?: NavBadgeKey;
  /** Highlight parent when any child route is active */
  exact?: boolean;
  permission?: PermissionKey;
  items?: NavItem[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const adminNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
        permission: "dashboard:view",
      },
    ],
  },
  {
    label: "My Workspace",
    items: [
      {
        label: "My Portal",
        href: "/admin/my",
        icon: Gauge,
        exact: true,
        permission: "portal:access",
      },
      {
        label: "My Profile",
        href: "/admin/my/profile",
        icon: BadgeCheck,
        permission: "portal:profile",
      },
      {
        label: "My Listings",
        href: "/admin/my/listings",
        icon: Building2,
        permission: "portal:property",
        items: [
          { label: "All My Listings", href: "/admin/my/listings", exact: true },
          { label: "Add Listing", href: "/admin/my/listings/new" },
        ],
      },
      {
        label: "My Posts",
        href: "/admin/my/posts",
        icon: FileText,
        permission: "portal:blog",
        items: [
          { label: "All My Posts", href: "/admin/my/posts", exact: true },
          { label: "Write Post", href: "/admin/my/posts/new" },
        ],
      },
      {
        label: "My Submissions",
        href: "/admin/my/submissions",
        icon: ClipboardList,
        permission: "portal:access",
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Property Management",
        href: "/admin/properties",
        icon: Building2,
        permission: "property:read",
        items: [
          { label: "All Properties", href: "/admin/properties", exact: true },
          {
            label: "Manual Properties",
            href: "/admin/properties?source=manual",
            badgeKey: "propertiesManual",
          },
          {
            label: "Off Plan Projects",
            href: "/admin/properties?source=leadrat",
            badgeKey: "propertiesLeadrat",
          },
          { label: "Upload Property", href: "/admin/properties/new" },
          {
            label: "Drafts",
            href: "/admin/properties?status=draft",
            badgeKey: "propertiesDraft",
          },
          {
            label: "Featured Properties",
            href: "/admin/properties?featured=true",
            badgeKey: "propertiesFeatured",
          },
        ],
      },
      {
        label: "Developers",
        href: "/admin/developers",
        icon: Handshake,
        permission: "developer:manage",
      },
      {
        label: "Agents",
        href: "/admin/agents",
        icon: Users,
        permission: "agent:manage",
      },
      {
        label: "Communities",
        href: "/admin/communities",
        icon: MapPin,
        permission: "location:manage",
      },
      {
        label: "Areas",
        href: "/admin/areas",
        icon: Map,
        permission: "location:manage",
      },
      {
        label: "Property Categories",
        href: "/admin/categories",
        icon: Boxes,
        permission: "property:read",
      },
      {
        label: "Amenities",
        href: "/admin/amenities",
        icon: Sparkles,
        permission: "amenity:manage",
      },
      {
        label: "Media Library",
        href: "/admin/media",
        icon: Images,
        permission: "media:read",
      },
    ],
  },
  {
    label: "Revenue",
    items: [
      {
        label: "Leads",
        href: "/admin/leads",
        icon: Inbox,
        permission: "lead:read",
        badgeKey: "leadsNew",
        items: [
          { label: "All Leads", href: "/admin/leads", exact: true, badgeKey: "leadsTotal" },
          { label: "New Leads", href: "/admin/leads?status=new", badgeKey: "leadsNew" },
          {
            label: "Follow Ups",
            href: "/admin/leads?status=follow_up",
            badgeKey: "leadsFollowUp",
          },
          {
            label: "Meetings",
            href: "/admin/leads?status=meeting",
            badgeKey: "leadsMeeting",
          },
          { label: "Closed", href: "/admin/leads?status=closed" },
          { label: "CRM Sync", href: "/admin/leads/crm-sync", badgeKey: "crmPending" },
        ],
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: ClipboardList,
        permission: "analytics:view",
      },
      {
        label: "Analytics",
        href: "/admin/analytics",
        icon: ChartPie,
        permission: "analytics:view",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Homepage Builder",
        href: "/admin/homepage",
        icon: LayoutTemplate,
        permission: "cms:homepage",
      },
      {
        label: "Pages",
        href: "/admin/pages",
        icon: ScrollText,
        permission: "cms:page",
      },
      {
        label: "Menus & footer",
        href: "/admin/menus",
        icon: Menu,
        permission: "cms:menu",
      },
      {
        label: "Landing Pages",
        href: "/admin/landing-pages",
        icon: Rocket,
        permission: "cms:landing",
      },
      {
        label: "Forms",
        href: "/admin/forms",
        icon: Workflow,
        permission: "cms:form",
      },
      {
        label: "Blog",
        href: "/admin/blog",
        icon: FileText,
        permission: "cms:blog",
      },
      {
        label: "API Fetch",
        href: "/admin/api-fetch",
        icon: Plug,
        permission: "cms:blog",
      },
      {
        label: "JSON Import",
        href: "/admin/content/import",
        icon: FileJson2,
        permission: "cms:blog",
      },
      {
        label: "Testimonials",
        href: "/admin/testimonials",
        icon: Quote,
        permission: "cms:page",
      },
      {
        label: "FAQs",
        href: "/admin/faqs",
        icon: CircleQuestionMark,
        permission: "cms:page",
      },
      {
        label: "SEO Manager",
        href: "/admin/seo",
        icon: Search,
        permission: "cms:seo",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Approvals",
        href: "/admin/approvals",
        icon: ShieldCheck,
        permission: "submission:review",
        badgeKey: "submissionsPending",
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        permission: "user:manage",
      },
      {
        label: "Roles & Permissions",
        href: "/admin/roles",
        icon: Shield,
        permission: "role:manage",
      },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        badgeKey: "notificationsUnread",
      },
      {
        label: "Activity Logs",
        href: "/admin/activity",
        icon: ScrollText,
        permission: "activity:view",
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "settings:manage",
      },
    ],
  },
];

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  tone: "primary" | "gold" | "neutral";
};

export const quickActions: QuickAction[] = [
  {
    label: "Upload Property",
    href: "/admin/properties/new",
    icon: Plus,
    description: "Form or JSON import",
    tone: "primary",
  },
  {
    label: "Import from LeadRat",
    href: "/admin/properties/import",
    icon: RefreshCw,
    description: "Sync CRM project inventory",
    tone: "neutral",
  },
  {
    label: "API Fetch",
    href: "/admin/api-fetch",
    icon: Plug,
    description: "Pull properties or blogs on demand",
    tone: "neutral",
  },
  {
    label: "Create Blog",
    href: "/admin/blog/new",
    icon: FileText,
    description: "Publish an article",
    tone: "neutral",
  },
  {
    label: "Create Landing Page",
    href: "/admin/landing-pages/new",
    icon: Rocket,
    description: "Campaign page",
    tone: "gold",
  },
  {
    label: "Upload Media",
    href: "/admin/media",
    icon: Images,
    description: "Images, brochures, plans",
    tone: "neutral",
  },
  {
    label: "Add Developer",
    href: "/admin/developers/new",
    icon: Handshake,
    description: "New developer profile",
    tone: "neutral",
  },
  {
    label: "Add Agent",
    href: "/admin/agents/new",
    icon: Users,
    description: "Sales consultant profile",
    tone: "neutral",
  },
  {
    label: "Add Community",
    href: "/admin/communities/new",
    icon: MapPin,
    description: "New community",
    tone: "neutral",
  },
];

/** Icons reused by dashboard KPI tiles and search results. */
export const entityIcons = {
  property: Building2,
  developer: Handshake,
  agent: Users,
  community: MapPin,
  area: Map,
  blog: FileText,
  lead: Inbox,
  user: Users,
  media: Images,
  landing: Rocket,
  category: Boxes,
  amenity: Sparkles,
  analytics: ChartColumn,
  activity: Activity,
  crm: Database,
  meeting: CalendarCheck,
  featured: Star,
  verified: BadgeCheck,
  campaign: Megaphone,
  tag: Tags,
  performance: Gauge,
} as const;
