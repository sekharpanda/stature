import { redirect } from "next/navigation";

/** Alias for shorter Insights URL. */
export default function InsightsAliasPage() {
  redirect("/market-insights");
}
