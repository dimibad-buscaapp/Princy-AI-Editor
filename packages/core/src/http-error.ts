import type { Response } from "express";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function sendError(response: Response, error: unknown, requestId?: string) {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      requestId
    });
    return;
  }
  response.status(500).json({
    error: "internal_server_error",
    requestId
  });
}
