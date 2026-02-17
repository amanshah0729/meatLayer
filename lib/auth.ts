import { supabase } from "./supabase";

/**
 * Validates an API key from the request header.
 * Returns the api_key row id if valid, null otherwise.
 */
export async function validateApiKey(
  request: Request
): Promise<string | null> {
  const key = request.headers.get("x-api-key");
  if (!key) return null;

  const { data, error } = await supabase
    .from("api_keys")
    .select("id")
    .eq("key", key)
    .single();

  if (error || !data) return null;
  return data.id;
}
