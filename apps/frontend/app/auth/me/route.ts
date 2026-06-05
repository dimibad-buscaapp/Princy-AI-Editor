export async function GET(request: Request) {
  const response = await fetch("http://13.140.129.77:3407/api/auth/me", {
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
