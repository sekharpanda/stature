import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { organizationRepository } from "../src/repositories/organization.repository";
import { runInventorySync } from "../src/services/property-sync.service";

async function main() {
  const org = await organizationRepository.getDefault();
  if (!org) throw new Error("No organization");
  // eslint-disable-next-line no-console
  console.log("syncing org", org.id, org.name);
  const result = await runInventorySync({
    organizationId: org.id,
    enrichDetails: true,
    markMissing: true,
    mode: "manual",
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
