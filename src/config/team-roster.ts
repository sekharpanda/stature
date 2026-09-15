/**
 * Canonical consultant roster. The seed and `scripts/seed-team-agents.ts`
 * upsert these into Agent so Admin → Agents, /our-team and each
 * /our-team/[slug] profile always describe the same people.
 *
 * Everything else on the profile (photo, phone, WhatsApp, bio, RERA number,
 * languages, specialties) is owned by Admin → Agents and is never overwritten
 * from here.
 */
export type TeamRosterEntry = {
  name: string;
  slug: string;
  title: string;
  /** Pinned to the top of the public roster. */
  isFeatured?: boolean;
  /**
   * Earlier slugs for the same person. The sync renames those rows in place so
   * listing assignments and profile edits survive a name correction.
   */
  previousSlugs?: string[];
};

export const TEAM_ROSTER: TeamRosterEntry[] = [
  {
    name: "Prajwal",
    slug: "prajwal",
    title: "Team Leader",
    isFeatured: true,
  },
  { name: "Prashant Tiwari", slug: "prashant-tiwari", title: "Property Consultant" },
  {
    name: "Evans Kipkoech",
    slug: "evans-kipkoech",
    title: "Property Consultant",
    previousSlugs: ["evans-k"],
  },
  {
    name: "Charlotte De Aguiar",
    slug: "charlotte-de-aguiar",
    title: "Property Consultant",
  },
  { name: "Kartik Kashyap", slug: "kartik-kashyap", title: "Property Consultant" },
  {
    name: "Sayeda Peerzade",
    slug: "sayeda-peerzade",
    title: "Property Consultant",
    previousSlugs: ["sayeda-h"],
  },
  { name: "Mohammed Kaif", slug: "mohammed-kaif", title: "Property Consultant" },
  {
    name: "Farhan Khan",
    slug: "farhan-khan",
    title: "Property Consultant",
    previousSlugs: ["farhan-k"],
  },
  { name: "Tabrez Shaik", slug: "tabrez-shaik", title: "Property Consultant" },
  {
    name: "Arbaz Abdul Jkaweed Khan",
    slug: "arbaz-abdul-jkaweed-khan",
    title: "Property Consultant",
  },
  { name: "Mohammed Shaheek", slug: "mohammed-shaheek", title: "Property Consultant" },
  { name: "Janum Bopanna", slug: "janum-bopanna", title: "Property Consultant" },
  { name: "Hrishikesh Rajgor", slug: "hrishikesh-rajgor", title: "Property Consultant" },
];
