import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export const apiError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export const validationError = (error: ZodError) => apiError(error.issues[0]?.message || "Invalid request.", 422);

export function requestFingerprint(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${agent.slice(0, 120)}`;
}
