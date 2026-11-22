import { z } from "zod";
import { objectIdSchema, pageQuerySchema } from "../../utilitys/pagination";

const title = z.string().trim().min(1).max(200);
const content = z.string().max(20000);

const createNoteSchema = z.object({
  body: z.object({ title, content: content.optional() }).strict(),
});

const updateNoteSchema = z.object({
  params: z.object({ noteId: objectIdSchema }),
  body: z
    .object({ title, content })
    .partial()
    .strict()
    .refine((b) => Object.keys(b).length > 0, "Nothing to update"),
});

const noteIdParamSchema = z.object({
  params: z.object({ noteId: objectIdSchema }),
});

const listNotesSchema = z.object({
  // `owner` only has an effect for admins
  query: pageQuerySchema.extend({ owner: objectIdSchema.optional() }),
});

export const noteValidation = {
  createNoteSchema,
  updateNoteSchema,
  noteIdParamSchema,
  listNotesSchema,
};
