import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import {
  getOffPlanConfig,
  isOffPlanReady,
  mapOffPlanListingToCanonical,
  offPlanClient,
} from "../src/providers/leadrat/index";

async function main() {
  // eslint-disable-next-line no-console
  console.log("ready", isOffPlanReady(), getOffPlanConfig());
  const list = await offPlanClient.listListings({ page: 1, pageSize: 20 });
  // eslint-disable-next-line no-console
  console.log("list", {
    count: list.count,
    results: list.results.length,
    pages: list.totalPages,
  });
  const detail = await offPlanClient.getListing(list.results[0]!.id);
  const c = mapOffPlanListingToCanonical(detail.project);
  // eslint-disable-next-line no-console
  console.log("sample", {
    name: c.name,
    images: c.images?.length,
    cover: c.images?.find((i) => i.isCover)?.url?.slice(0, 120),
    minPrice: c.minPrice,
    payment: c.depositDescription,
    sale: c.saleStatus,
    completion: c.completionLabel,
    developer: c.developer?.name,
    reellyId: c.reellyProjectId,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
