# Coding Standards (Phase 0)

- TypeScript strict; no `any`
- Zod at every external boundary
- Business logic in `services/`; UI is presentation only
- Soft deletes via `deletedAt`; never hard-delete in app flows
- Public DTOs must strip `source`, `externalId`, `externalPayload`
- Secrets only in server env (never `NEXT_PUBLIC_` for API keys)
- Permission checks in services via `requirePermission`
- File naming: `kebab-case.ts` / `PascalCase.tsx`
- Commits: conventional (`feat:`, `fix:`, `chore:`)
