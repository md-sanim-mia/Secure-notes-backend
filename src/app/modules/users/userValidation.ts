import { z } from "zod";
import { objectIdSchema, pageQuerySchema } from "../../utilitys/pagination";
import { USER_ROLES } from "./users.consten";

const nameField = z.string().trim().min(1).max(100);
const emailField = z.string().trim().toLowerCase().email().max(254);
const passwordField = z.string().min(8).max(72); // bcrypt only uses the first 72 bytes
const interestsField = z.array(z.string().trim().min(1).max(30)).max(20);

const createUserSchema = z.object({
  body: z
    .object({
      name: nameField,
      email: emailField,
      password: passwordField,
      role: z.enum(USER_ROLES).optional(),
      interests: interestsField.optional(),
    })
    .strict(),
});

const updateUserSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  body: z
    .object({
      name: nameField,
      email: emailField,
      password: passwordField,
      role: z.enum(USER_ROLES),
      interests: interestsField,
    })
    .partial()
    .strict()
    .refine((b) => Object.keys(b).length > 0, "Nothing to update"),
});

// a user editing their own profile cannot touch role/email/password here
const updateMeSchema = z.object({
  body: z
    .object({ name: nameField, interests: interestsField })
    .partial()
    .strict()
    .refine((b) => Object.keys(b).length > 0, "Nothing to update"),
});

const userIdParamSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
});

const listUsersSchema = z.object({ query: pageQuerySchema });

const interestGroupsSchema = z.object({
  query: pageQuerySchema.omit({ cursor: true }).extend({
    // cursor for groups is the interest name of the last group on the page
    cursor: z.string().trim().toLowerCase().min(1).max(30).optional(),
    interest: z.string().trim().toLowerCase().min(1).max(30).optional(),
  }),
});

export const userValidation = {
  createUserSchema,
  updateUserSchema,
  updateMeSchema,
  userIdParamSchema,
  listUsersSchema,
  interestGroupsSchema,
};
