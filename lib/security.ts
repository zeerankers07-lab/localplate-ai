import { NextResponse } from "next/server";

export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  try {
    return origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

export function securityHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function rateLimitResponse(retryAfter: number) {
  const response = NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(Math.max(1, retryAfter)));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
