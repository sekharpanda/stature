import type { LucideIcon } from "lucide-react";
import {
  Construction,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  phase?: string;
};

export function ModulePlaceholder({
  title,
  description,
  icon = Construction,
  phase = "Upcoming module",
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{phase}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
        <Badge variant="secondary">Shell ready</Badge>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Enterprise module scaffold
          </CardTitle>
          <CardDescription>
            Navigation, permissions and layout are wired. Full CRUD ships in the
            dedicated module phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={icon}
            title={`${title} is next`}
            description="We are polishing the REOS shell first, then implementing each module production-ready."
            className="py-16"
          />
        </CardContent>
      </Card>
    </div>
  );
}
