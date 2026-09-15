"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CircleAlert,
  FileText,
  Inbox,
  RefreshCw,
  Building2,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

const typeMeta: Record<
  string,
  { icon: typeof Bell; tone: string; label: string }
> = {
  NEW_LEAD: { icon: Inbox, tone: "text-primary bg-primary/10", label: "Lead" },
  CRM_SYNC_FAILED: {
    icon: CircleAlert,
    tone: "text-destructive bg-destructive/10",
    label: "CRM",
  },
  PROPERTY_SYNC_FAILED: {
    icon: RefreshCw,
    tone: "text-destructive bg-destructive/10",
    label: "Sync",
  },
  PROPERTY_PUBLISHED: {
    icon: Building2,
    tone: "text-[var(--success)] bg-[var(--success)]/10",
    label: "Property",
  },
  PROPERTY_EXPIRED: {
    icon: Building2,
    tone: "text-[var(--warning)] bg-[var(--warning)]/10",
    label: "Property",
  },
  BLOG_SCHEDULED: {
    icon: FileText,
    tone: "text-[var(--info)] bg-[var(--info)]/10",
    label: "Blog",
  },
};

const fallbackMeta = {
  icon: Bell,
  tone: "text-muted-foreground bg-muted",
  label: "System",
};

export function NotificationCenter({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  function handleOpen(id: string, isRead: boolean) {
    if (isRead) return;
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[22rem] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              disabled={pending}
              onClick={handleMarkAll}
            >
              <CheckCheck className="size-3.5" />
              Mark all
            </Button>
          ) : null}
        </div>
        <Separator />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Bell className="size-4 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground">
              Lead activity and sync alerts will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {notifications.map((item) => {
                const meta = typeMeta[item.type] ?? fallbackMeta;
                const Icon = meta.icon;

                const content = (
                  <div className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        meta.tone,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p
                          className={cn(
                            "flex-1 truncate text-sm",
                            item.isRead ? "font-normal" : "font-semibold",
                          )}
                        >
                          {item.title}
                        </p>
                        {!item.isRead ? (
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      {item.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {item.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => handleOpen(item.id, item.isRead)}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => handleOpen(item.id, item.isRead)}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}

        <Separator />
        <div className="p-2">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs">
            <Link href="/admin/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
