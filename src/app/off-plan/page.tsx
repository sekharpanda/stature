import { redirect } from "next/navigation";

/** Alias matching the header Off-Plan item (no dedicated /off-plan catalogue). */
export default function OffPlanAliasPage() {
  redirect("/properties?completion=off-plan");
}
