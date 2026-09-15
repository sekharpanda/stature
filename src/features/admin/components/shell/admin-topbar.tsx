"use client";

import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { quickActions } from "@/config/admin-nav";
import { AdminBreadcrumbs } from "@/features/admin/components/shell/admin-breadcrumbs";
import { GlobalSearch } from "@/features/admin/components/shell/global-search";
import {
  NotificationCenter,
  type NotificationItem,
} from "@/features/admin/components/shell/notification-center";
import { ThemeToggle } from "@/features/admin/components/shell/theme-toggle";
import { UserMenu } from "@/features/admin/components/shell/user-menu";

type AdminTopbarProps = {
  user: { name: string; email: string; image?: string | null };
  notifications: NotificationItem[];
  unreadCount: number;
};

export function AdminTopbar({
  user,
  notifications,
  unreadCount,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 hidden h-5 sm:block" />

        <div className="hidden min-w-0 flex-1 md:block">
          <AdminBreadcrumbs />
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 md:flex-none">
          <div className="min-w-0 max-w-full flex-1 sm:max-w-none sm:flex-none">
            <GlobalSearch />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="hidden gap-1.5 lg:inline-flex">
                <Plus className="size-4" />
                Quick action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Create or import</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickActions.map((action) => (
                <DropdownMenuItem key={action.href} asChild>
                  <Link href={action.href} className="gap-2">
                    <action.icon className="size-4" />
                    <span className="flex-1">{action.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/properties/import">
                  <RefreshCw className="size-4" />
                  Sync LeadRat now
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <UserMenu user={user} variant="topbar" />
        </div>
      </div>
    </header>
  );
}
