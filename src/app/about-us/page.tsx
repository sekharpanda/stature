import { redirect } from "next/navigation";

/** Alias for design-reference /about-us path. */
export default function AboutUsAliasPage() {
  redirect("/about");
}
