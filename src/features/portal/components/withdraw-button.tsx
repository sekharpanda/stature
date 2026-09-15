"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { withdrawSubmissionAction } from "@/actions/portal";

export function WithdrawButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await withdrawSubmissionAction(submissionId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Request withdrawn");
          router.refresh();
        })
      }
    >
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Undo2 className="mr-2 size-4" />
      )}
      Withdraw
    </Button>
  );
}
