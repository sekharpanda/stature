import path from "node:path";

import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI only reads .env, but the app and scripts run off .env.local.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
