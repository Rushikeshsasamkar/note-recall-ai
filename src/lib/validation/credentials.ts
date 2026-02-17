import { z } from "zod";

export const credentialsSignUpSchema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(3).max(32).optional().or(z.literal("")),
  password: z.string().min(8).max(128),
});

export const credentialsSignInSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(8).max(128),
});
