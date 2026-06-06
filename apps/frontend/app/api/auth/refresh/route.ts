import { getGatewayUrl } from "../../../../src/lib/gateway-url";

export async function POST(request: Request) {
  const body = await request.text();

  const response = await fetch(`${getGatewayUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json"
    },
    body
  });

  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
