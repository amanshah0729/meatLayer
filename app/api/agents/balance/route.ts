import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/agents/balance?api_key=xxx — Return balance for legacy agent
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("api_key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "api_key is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("agents")
    .select("balance")
    .eq("api_key", apiKey)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ balance: data.balance ?? 0 });
}
