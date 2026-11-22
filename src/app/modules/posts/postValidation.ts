import { z } from "zod";
import { objectIdSchema, pageQuerySchema } from "../../utilitys/pagination";

const title = z.string().trim().min(1).max(200);
const content = z.string().max(20000);

const createPostSchema = z.object({
  body: z.object({ title, content: content.optional() }).strict(),
});

const updatePostSchema = z.object({
  params: z.object({ postId: objectIdSchema }),
  body: z
    .object({ title, content })
    .partial()
    .strict()
    .refine((b) => Object.keys(b).length > 0, "Nothing to update"),
});

const postIdParamSchema = z.object({
  params: z.object({ postId: objectIdSchema }),
});

const listPostsSchema = z.object({ query: pageQuerySchema });

const userPostsSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  query: pageQuerySchema,
});

export const postValidation = {
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  listPostsSchema,
  userPostsSchema,
};
