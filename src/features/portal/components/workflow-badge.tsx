import type { SubmissionStatus, WorkflowState } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const WORKFLOW_COPY: Record<
  WorkflowState,
  { label: string; className?: string; variant?: "secondary" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  IN_REVIEW: {
    label: "Awaiting approval",
    className: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  },
  PUBLISHED: {
    label: "Live",
    className: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  },
  REJECTED: {
    label: "Changes requested",
    className: "bg-red-100 text-red-900 hover:bg-red-100",
  },
  ARCHIVED: { label: "Archived", variant: "outline" },
};

const SUBMISSION_COPY: Record<
  SubmissionStatus,
  { label: string; className?: string; variant?: "secondary" | "outline" }
> = {
  PENDING: {
    label: "Awaiting approval",
    className: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  },
  REJECTED: {
    label: "Changes requested",
    className: "bg-red-100 text-red-900 hover:bg-red-100",
  },
  WITHDRAWN: { label: "Withdrawn", variant: "outline" },
};

export function WorkflowBadge({
  state,
  fallbackLabel = "Live",
}: {
  state: WorkflowState | null;
  /** Staff-managed records carry no workflow state. */
  fallbackLabel?: string;
}) {
  if (!state) {
    return (
      <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
        {fallbackLabel}
      </Badge>
    );
  }
  const copy = WORKFLOW_COPY[state];
  return (
    <Badge variant={copy.variant} className={copy.className}>
      {copy.label}
    </Badge>
  );
}

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  const copy = SUBMISSION_COPY[status];
  return (
    <Badge variant={copy.variant} className={copy.className}>
      {copy.label}
    </Badge>
  );
}
