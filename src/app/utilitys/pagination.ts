import { z } from "zod";

export const MAX_PAGE_LIMIT = 50;
export const DEFAULT_PAGE_LIMIT = 10;

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/**
 * Keyset (cursor) pagination: `?limit=10&cursor=<last _id of previous page>`.
 * Every list is sorted by `_id` (ObjectIds are creation ordered), so every
 * list is served by an index and the cost does not grow with the page number
 * the way `skip()` does.
 */
export const pageQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .default(DEFAULT_PAGE_LIMIT),
  cursor: objectIdSchema.optional(),
});

export type TPageQuery = z.infer<typeof pageQuerySchema>;

export type TPageMeta = {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
};

/**
 * Queries fetch `limit + 1` rows; the extra row only tells us whether another
 * page exists.
 */
export const buildPage = <T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string
): { data: T[]; meta: TPageMeta } => {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  return {
    data,
    meta: {
      limit,
      hasMore,
      nextCursor: hasMore ? cursorOf(data[data.length - 1]) : null,
    },
  };
};
