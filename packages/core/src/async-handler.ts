import type { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpError, sendError } from "./http-error.js";

export function asyncHandler(handler: (request: Request, response: Response) => Promise<void>): RequestHandler {
  return async (request, response, next) => {
    try {
      await handler(request, response);
    } catch (error) {
      if (error instanceof HttpError) {
        sendError(response, error, String(response.locals.requestId ?? ""));
        return;
      }
      next(error);
    }
  };
}
