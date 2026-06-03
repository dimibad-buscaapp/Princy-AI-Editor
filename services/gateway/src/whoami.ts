import type { Express, Request, Response } from "express";

function getForwardedProto(request: Request) {
  return request.header("x-forwarded-proto") ?? request.protocol ?? "http";
}

export function registerGatewayWhoamiRoute(app: Express) {
  app.get("/gateway/whoami", (request: Request, response: Response) => {
    response.json({
      gateway: true,
      requestId: response.locals.requestId,
      ip: request.ip ?? request.socket.remoteAddress,
      hasAuthorization: Boolean(request.header("authorization")),
      forwarded: {
        host: request.header("x-forwarded-host") ?? request.header("host") ?? "",
        proto: getForwardedProto(request)
      }
    });
  });
}
