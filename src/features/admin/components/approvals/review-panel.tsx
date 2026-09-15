"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reviewSubmissionAction } from "@/actions/submissions";

type AgentOption = { id: string; name: string };

export function ReviewPanel({
  submissionId,
  entityType,
  kind,
  agentOptions,
}: {
  submissionId: string;
  entityType: string;
  kind: string;
  agentOptions: AgentOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reviewNote, setReviewNote] = useState("");
  const [agentId, setAgentId] = useState<string>("new");

  const isAccessRequest = entityType === "AGENT_ACCOUNT";

  function decide(decision: "approve" | "reject") {
    if (decision === "reject" && reviewNote.trim().length < 3) {
      toast.error("Tell them what needs changing before rejecting");
      return;
    }

    startTransition(async () => {
      const result = await reviewSubmissionAction({
        submissionId,
        decision,
        reviewNote,
        agentId: isAccessRequest && agentId !== "new" ? agentId : null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        decision === "approve"
          ? isAccessRequest
            ? "Portal access granted"
            : "Approved and live"
          : "Sent back with your note",
      );
      router.push("/admin/approvals");
      router.refresh();
    });
  }

  return (
    <Card className="card-elevated border-border/80">
      <CardHeader>
        <CardTitle className="font-display text-xl">Decision</CardTitle>
        <CardDescription>
          {kind === "UPDATE"
            ? "Approving applies these changes to the live version straight away."
            : isAccessRequest
              ? "Approving creates the login, assigns the agent role and links a consultant profile."
              : "Approving publishes this on the website immediately."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAccessRequest ? (
          <div className="space-y-2">
            <Label>Link to consultant profile</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  Create a new profile (hidden until you activate it)
                </SelectItem>
                {agentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="reviewNote">
            Note for the agent {`(required when rejecting)`}
          </Label>
          <Textarea
            id="reviewNote"
            rows={3}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Add the handover date and a cover photo, then resubmit."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button disabled={pending} onClick={() => decide("approve")}>
            {pending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            Approve
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => decide("reject")}
          >
            <X className="mr-2 size-4" />
            Request changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
