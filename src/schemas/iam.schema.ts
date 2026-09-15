import { z } from "zod";

export const inviteUserSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  roleId: z.string().min(1),
  /** Optional — server generates a secure temporary password when omitted. */
  temporaryPassword: z.string().min(8).max(72).optional(),
  status: z.enum(["ACTIVE", "INVITED"]).optional().default("INVITED"),
});

export const resendInviteSchema = z.object({
  userId: z.string().min(1),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"]),
});

export const setUserRolesSchema = z.object({
  userId: z.string().min(1),
  roleIds: z.array(z.string().min(1)).min(1).max(10),
});

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"]),
  roleId: z.string().min(1),
});

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ResendInviteInput = z.infer<typeof resendInviteSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
