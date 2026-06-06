import { getGatewayUrl } from "../../../src/lib/gateway-url";

export async function GET(request: Request) {
  const response = await fetch(`${getGatewayUrl()}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: request.headers.get("authorization") ?? "",
      "Content-Type": "application/json"
    }
  });

  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
