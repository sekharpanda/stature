import { redirect } from "next/navigation";

/** Alias matching the header Buy item (catalogue lives at /properties). */
export default function BuyAliasPage() {
  redirect("/properties");
}
