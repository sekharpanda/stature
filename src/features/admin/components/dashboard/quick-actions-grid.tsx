"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { quickActions } from "@/config/admin-nav";
import { cn } from "@/lib/utils";

const toneClass = {
  primary: "bg-primary/10 text-primary",
  gold: "bg-accent text-accent-foreground",
  neutral: "bg-muted text-muted-foreground",
} as const;

export function QuickActionsGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {quickActions.map((action, index) => (
        <motion.div
          key={action.href}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.25 }}
        >
          <Link href={action.href} className="block h-full">
            <Card className="card-elevated h-full border-border/80 transition-all hover:-translate-y-0.5 hover:border-primary/35">
              <CardContent className="flex h-full flex-col gap-3 p-4">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md",
                    toneClass[action.tone],
                  )}
                >
                  <action.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
