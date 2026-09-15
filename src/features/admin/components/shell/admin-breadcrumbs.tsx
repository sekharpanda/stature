"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labels: Record<string, string> = {
  admin: "Dashboard",
  properties: "Properties",
  developers: "Developers",
  communities: "Communities",
  areas: "Areas",
  categories: "Categories",
  amenities: "Amenities",
  media: "Media Library",
  leads: "Leads",
  "crm-sync": "CRM Sync",
  homepage: "Homepage Builder",
  "landing-pages": "Landing Pages",
  forms: "Forms",
  blog: "Blog",
  testimonials: "Testimonials",
  faqs: "FAQs",
  seo: "SEO Manager",
  users: "Users",
  roles: "Roles & Permissions",
  notifications: "Notifications",
  activity: "Activity Logs",
  reports: "Reports",
  analytics: "Analytics",
  settings: "Settings",
  new: "Create",
  import: "Import",
};

function humanize(segment: string) {
  return (
    labels[segment] ??
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    return { segment, href, isLast, label: humanize(segment) };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin" className="inline-flex items-center gap-1.5">
              <Home className="size-3.5" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
