import { redirect } from "next/navigation";

/** Alias for design-reference /blogs path. */
export default function BlogsAliasPage() {
  redirect("/blog");
}
