import { createClient } from "@supabase/supabase-js";

function required(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SECRET_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function createAdminClient() {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function authenticateRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error) return null;
  return data.user;
}
