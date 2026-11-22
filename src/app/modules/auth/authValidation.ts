import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(72);

const registerSchema = z.object({
  // `role` is deliberately not accepted: self-registration always creates a "user"
  body: z
    .object({
      name: z.string().trim().min(1).max(100),
      email,
      password,
      interests: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
    })
    .strict(),
});

const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1).max(72) }).strict(),
});

const changePasswordSchema = z.object({
  body: z
    .object({ oldPassword: z.string().min(1).max(72), newPassword: password })
    .strict(),
});

export const authValidation = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
};
