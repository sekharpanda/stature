/**
 * Re-upload .env.local to Vercel production/preview without trailing newlines.
 * Usage: npx tsx scripts/sync-vercel-env.ts
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { spawnSync } from "child_process";

const ENV_FILE = ".env.local";
const SKIP = new Set(["NODE_ENV"]);

// Production overrides for public URLs
const OVERRIDES: Record<string, string> = {
  NEXT_PUBLIC_APP_URL: "https://prowin-property-next-js.vercel.app",
  BETTER_AUTH_URL: "https://prowin-property-next-js.vercel.app",
};

function parseEnv(raw: string) {
  const map = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    // Strip accidental whitespace/newlines from values
    val = val.replace(/^\s+|\s+$/g, "").replace(/[\r\n]+/g, "");
    if (!key || SKIP.has(key)) continue;
    map.set(key, val);
  }
  for (const [k, v] of Object.entries(OVERRIDES)) {
    map.set(k, v);
  }
  // Ensure CRON_SECRET is a clean non-empty value if present/empty
  const cron = map.get("CRON_SECRET");
  if (!cron) {
    map.set(
      "CRON_SECRET",
      Buffer.from(
        Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
      ).toString("hex"),
    );
  }
  return map;
}

function setEnv(key: string, value: string, environment: string) {
  const tmp = `.vercel-env-tmp-${key}-${environment}`;
  writeFileSync(tmp, value, { encoding: "utf8" });
  try {
    // Remove first (ignore failure)
    spawnSync("npx", ["vercel", "env", "rm", key, environment, "--yes"], {
      stdio: "ignore",
      shell: true,
    });
    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", key, environment],
      {
        input: readFileSync(tmp),
        encoding: "buffer",
        shell: true,
      },
    );
    const out = `${r.stdout?.toString() ?? ""}${r.stderr?.toString() ?? ""}`;
    if (r.status !== 0 && !/Added|Created|Overrode|Saved/i.test(out)) {
      console.error(`FAIL ${key} ${environment}: ${out.slice(0, 300)}`);
      return false;
    }
    console.log(`OK ${key} → ${environment}`);
    return true;
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

const env = parseEnv(readFileSync(ENV_FILE, "utf8"));
console.log(`Syncing ${env.size} keys…`);
for (const [key, value] of env) {
  for (const environment of ["production", "preview"] as const) {
    const v =
      environment === "production" && OVERRIDES[key]
        ? OVERRIDES[key]!
        : value;
    setEnv(key, v, environment);
  }
}
console.log("Done.");
