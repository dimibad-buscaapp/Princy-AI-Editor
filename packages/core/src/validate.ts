import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { HttpError } from "./http-error.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      next(new HttpError(400, "validation_error", parsed.error.issues.map((i) => i.message).join("; ")));
      return;
    }
    request.body = parsed.data;
    next();
  };
}
