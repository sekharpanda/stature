import { redirect } from "next/navigation";

type Params = Promise<{ slug: string[] }>;

// All unknown public routes redirect to the home page.
// The home page contains all Stature content (services, projects, contact, etc.)
export default async function CatchAllPage({ params }: { params: Params }) {
  const { slug } = await params;
  const path = (slug ?? []).filter(Boolean).join("/");

  // Allow legal/support pages to be served from the custom page system
  const KEEP_SLUGS = ["privacy", "terms", "disclaimer", "cookies", "thank-you"];
  if (KEEP_SLUGS.includes(path.split("/")[0] ?? "")) {
    redirect(`/`);
  }

  // Everything else → home
  redirect("/");
}
