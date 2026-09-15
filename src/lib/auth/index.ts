import { auth } from "./auth";
import { headers } from "next/headers";

export { auth } from "./auth";
export type { Session } from "./auth";
export {
  requirePermission,
  getUserPermissionKeys,
  getUserRoleSlugs,
} from "./rbac";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
