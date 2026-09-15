"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminNav, type NavBadgeKey, type NavItem } from "@/config/admin-nav";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/features/admin/components/shell/user-menu";

export type NavBadges = Partial<Record<NavBadgeKey, number>>;

type RouteState = {
  pathname: string;
  params: URLSearchParams;
};

export const PORTAL_SECTION_LABEL = "My Workspace";

type AppSidebarProps = {
  badges: NavBadges;
  permissions: string[];
  /** Portal links only make sense once a consultant profile is linked. */
  showPortal?: boolean;
  user: { name: string; email: string; image?: string | null };
};

function splitHref(href: string) {
  const [path, query = ""] = href.split("?");
  return { path, query: new URLSearchParams(query) };
}

/**
 * Query-aware matching so filtered views (drafts, featured, source) do not all
 * highlight at once on the same pathname.
 */
function isItemActive(item: NavItem, route: RouteState): boolean {
  const { path, query } = splitHref(item.href);
  const queryKeys = [...query.keys()];

  if (route.pathname !== path && !route.pathname.startsWith(`${path}/`)) {
    return false;
  }

  if (queryKeys.length > 0) {
    return (
      route.pathname === path &&
      queryKeys.every((key) => route.params.get(key) === query.get(key))
    );
  }

  if (item.exact) {
    return route.pathname === path && [...route.params.keys()].length === 0;
  }

  return true;
}

function isBranchActive(item: NavItem, route: RouteState): boolean {
  const { path } = splitHref(item.href);
  if (route.pathname === path || route.pathname.startsWith(`${path}/`)) {
    return true;
  }
  return (item.items ?? []).some((child) => isItemActive(child, route));
}

export function AppSidebar({
  badges,
  permissions,
  showPortal = false,
  user,
}: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const route = useMemo<RouteState>(
    () => ({ pathname, params: new URLSearchParams(searchParams.toString()) }),
    [pathname, searchParams],
  );

  const sections = useMemo(
    () =>
      adminNav
        .filter(
          (section) => showPortal || section.label !== PORTAL_SECTION_LABEL,
        )
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) => !item.permission || permissionSet.has(item.permission),
          ),
        }))
        .filter((section) => section.items.length > 0),
    [permissionSet, showPortal],
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-display text-sm font-semibold text-primary-foreground">
            P
          </span>
          <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-display text-[15px] font-semibold tracking-wide">
              {brand.name.split(" ")[0]}
            </span>
            <span className="truncate text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
              REOS Admin
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.18em] uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) =>
                  item.items?.length ? (
                    <CollapsibleNavItem
                      key={item.href}
                      item={item}
                      route={route}
                      badges={badges}
                    />
                  ) : (
                    <SimpleNavItem
                      key={item.href}
                      item={item}
                      route={route}
                      badges={badges}
                    />
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu user={user} variant="sidebar" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavBadge({
  badgeKey,
  badges,
}: {
  badgeKey?: NavBadgeKey;
  badges: NavBadges;
}) {
  if (!badgeKey) return null;
  const value = badges[badgeKey];
  if (!value) return null;

  return (
    <SidebarMenuBadge className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary tabular-nums">
      {value > 99 ? "99+" : value}
    </SidebarMenuBadge>
  );
}

function SimpleNavItem({
  item,
  route,
  badges,
}: {
  item: NavItem;
  route: RouteState;
  badges: NavBadges;
}) {
  const { setOpenMobile, isMobile } = useSidebar();
  const active = isItemActive(item, route);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className={cn(
          "gap-2.5 font-medium transition-colors",
          active && "text-primary",
        )}
      >
        <Link
          href={item.href}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          {Icon ? <Icon className="size-4 shrink-0" /> : null}
          <span className="truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
      <NavBadge badgeKey={item.badgeKey} badges={badges} />
    </SidebarMenuItem>
  );
}

function CollapsibleNavItem({
  item,
  route,
  badges,
}: {
  item: NavItem;
  route: RouteState;
  badges: NavBadges;
}) {
  const { state, isMobile, setOpen, setOpenMobile } = useSidebar();
  const branchActive = isBranchActive(item, route);
  const [open, setOpen_] = useState(branchActive);
  const Icon = item.icon;

  // Reveal the active branch after navigation without locking it open.
  useEffect(() => {
    if (branchActive) setOpen_(true);
  }, [branchActive]);

  const iconOnly = state === "collapsed" && !isMobile;

  function handleToggle() {
    // In icon mode the sub-menu is hidden, so expand the rail first.
    if (iconOnly) {
      setOpen(true);
      setOpen_(true);
      return;
    }
    setOpen_((prev) => !prev);
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen_}
      className="group/collapsible"
      asChild
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          isActive={branchActive}
          tooltip={item.label}
          className={cn(
            "gap-2.5 font-medium transition-colors",
            branchActive && "text-primary",
          )}
        >
          {Icon ? <Icon className="size-4 shrink-0" /> : null}
          <span className="truncate">{item.label}</span>
          <ChevronRight
            className={cn(
              "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </SidebarMenuButton>

        <CollapsibleContent className="overflow-hidden">
          <SidebarMenuSub className="mt-0.5">
            {item.items?.map((child) => {
              const childActive = isItemActive(child, route);
              const badgeValue = child.badgeKey
                ? badges[child.badgeKey]
                : undefined;

              return (
                <SidebarMenuSubItem key={`${child.href}-${child.label}`}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={childActive}
                    className={cn(childActive && "font-medium text-primary")}
                  >
                    <Link
                      href={child.href}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <span className="truncate">{child.label}</span>
                      {badgeValue ? (
                        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
                          {badgeValue > 99 ? "99+" : badgeValue}
                        </span>
                      ) : null}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
