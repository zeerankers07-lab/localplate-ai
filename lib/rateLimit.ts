import { createClient } from "@/lib/supabase/server";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

type RateLimitResponse = {
  allowed?: boolean;
  remaining?: number;
  retry_after?: number;
  error?: string;
};

/**
 * Database-backed rate limiting using Supabase RPC.
 */
export async function checkRateLimit(
  endpoint: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_ai_rate_limit", {
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error);
    return null;
  }

  const result = data as RateLimitResponse | null;

  if (!result || typeof result.allowed !== "boolean") {
    console.error("Invalid rate limit response:", data);
    return null;
  }

  if (result.error === "unauthorized") {
    console.error("Rate limit RPC: unauthorized");
    return null;
  }

  return {
    allowed: result.allowed,
    remaining: Number(result.remaining ?? 0),
    retryAfter: Number(result.retry_after ?? 1),
  };
}