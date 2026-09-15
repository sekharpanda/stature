/**
 * Preferred developers / projects for fallback matching.
 * Admin listing order on Developer.listPriority is the source of truth for rank.
 * Keep labels aligned with the A–Z sales list for project-name fallbacks.
 */
export type PriorityDeveloperEntry = {
  label: string;
  /** Substrings matched against developer.name (case-insensitive). */
  developerMatchers: string[];
  /** Substrings matched against property.name (case-insensitive). */
  projectMatchers: string[];
};

export const PRIORITY_DEVELOPERS: PriorityDeveloperEntry[] = [
  {
    label: "AG",
    developerMatchers: ["ag development", "ag developers", "ag properties"],
    projectMatchers: ["the corner"],
  },
  {
    label: "Aark",
    developerMatchers: ["aark"],
    projectMatchers: ["aark terraces"],
  },
  {
    label: "ALA",
    developerMatchers: ["ala development", "ala developers", "ala properties"],
    projectMatchers: ["havencia"],
  },
  {
    label: "Al Fulaiti",
    developerMatchers: ["fulaiti"],
    projectMatchers: ["fulaiti"],
  },
  {
    label: "Al Waleed",
    developerMatchers: ["al waleed", "alwaleed"],
    projectMatchers: ["alwaleed"],
  },
  {
    label: "Deniz",
    developerMatchers: ["deniz"],
    projectMatchers: ["09 life"],
  },
  {
    label: "Dugasta",
    developerMatchers: ["dugasta"],
    projectMatchers: ["terra tower", "maya"],
  },
  {
    label: "Enaam",
    developerMatchers: ["enaam"],
    projectMatchers: ["azra"],
  },
  {
    label: "Empire",
    developerMatchers: ["empire development", "empire developers", "empire properties"],
    projectMatchers: ["empire gardens"],
  },
  {
    label: "GFS",
    developerMatchers: ["gfs"],
    projectMatchers: ["coventry"],
  },
  {
    label: "Grovy",
    developerMatchers: ["grovy"],
    projectMatchers: ["rivo"],
  },
  {
    label: "Gutti",
    developerMatchers: ["gutti"],
    projectMatchers: ["veona"],
  },
  {
    label: "HMB",
    developerMatchers: ["hmb"],
    projectMatchers: ["beverly park"],
  },
  {
    label: "HRE",
    developerMatchers: ["hre development", "hre developers", "hre properties"],
    projectMatchers: ["wadi hills"],
  },
  {
    label: "HZ",
    developerMatchers: ["hz development", "hz developers", "hz properties"],
    projectMatchers: ["forest city"],
  },
  {
    label: "Imtiaz",
    developerMatchers: ["imtiaz"],
    projectMatchers: ["le blanc", "the archive"],
  },
  {
    label: "Karma",
    developerMatchers: ["karma"],
    projectMatchers: ["milos"],
  },
  {
    label: "Leos",
    developerMatchers: ["leos"],
    projectMatchers: ["weighbridge"],
  },
  {
    label: "Marquis",
    developerMatchers: ["marquis"],
    projectMatchers: ["marquis vista"],
  },
  {
    label: "Mashriq Elite",
    developerMatchers: ["mashriq"],
    projectMatchers: ["florea"],
  },
  {
    label: "Mr Eight",
    developerMatchers: ["mr eight", "mr. eight"],
    projectMatchers: ["wow tower"],
  },
  {
    label: "Object 1",
    developerMatchers: ["object 1", "object1"],
    projectMatchers: ["verdania"],
  },
  {
    label: "Peace Homes",
    developerMatchers: ["peace homes", "peace home"],
    projectMatchers: ["peace lagoons"],
  },
  {
    label: "Pearlshire",
    developerMatchers: ["pearlshire"],
    projectMatchers: ["bond living"],
  },
  {
    label: "Prestige One",
    developerMatchers: ["prestige one"],
    projectMatchers: ["the boulevard"],
  },
  {
    label: "Reef",
    developerMatchers: ["reef development", "reef developers", "reef properties"],
    projectMatchers: ["reef 998"],
  },
  {
    label: "Samana",
    developerMatchers: ["samana"],
    projectMatchers: ["samana ibiza", "ibiza"],
  },
  {
    label: "Saray",
    developerMatchers: ["saray"],
    projectMatchers: ["saray prime"],
  },
  {
    label: "Tarrad",
    developerMatchers: ["tarrad"],
    projectMatchers: ["celesto"],
  },
  {
    label: "Wadan",
    developerMatchers: ["wadan"],
    projectMatchers: ["weston"],
  },
];

/** Non-priority properties sort after all preferred ones. */
export const DEFAULT_LIST_PRIORITY = 9999;

function includesMatch(haystack: string, needle: string): boolean {
  return haystack.includes(needle.trim().toLowerCase());
}

/**
 * Returns 0-based list priority (lower = first). Unmatched → DEFAULT_LIST_PRIORITY.
 * Prefer admin-set developer.listPriority, then sheet/project matchers (lowest wins).
 */
export function computeListPriority(
  propertyName: string | null | undefined,
  developerName: string | null | undefined,
  developerListPriority?: number | null,
): number {
  const prop = (propertyName ?? "").trim().toLowerCase();
  const dev = (developerName ?? "").trim().toLowerCase();
  let best = DEFAULT_LIST_PRIORITY;

  if (
    typeof developerListPriority === "number" &&
    developerListPriority < best
  ) {
    best = developerListPriority;
  }

  for (let i = 0; i < PRIORITY_DEVELOPERS.length; i++) {
    const entry = PRIORITY_DEVELOPERS[i]!;
    const byDev =
      Boolean(dev) &&
      entry.developerMatchers.some((m) => includesMatch(dev, m));
    const byProject =
      Boolean(prop) &&
      entry.projectMatchers.some((m) => includesMatch(prop, m));
    if ((byDev || byProject) && i < best) {
      best = i;
    }
  }

  return best;
}
