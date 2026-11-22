import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

// schema shape: z.object({ body?, query?, params? })
export const validationRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      next();
    } catch (error) {
      next(error);
    }
  };
};
