import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEMO_STORAGE_POINTER = "demo";
const DEMO_BLOB_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

// POST /api/agents/create-demo — Create agent in DB only (no 0G upload, no mint)
// Body: { ownerAddress, name, persona?, confidence_threshold? }
export async function POST(request: Request) {
  const body = await request.json();
  const { ownerAddress, name, persona, confidence_threshold } = body;

  if (!ownerAddress) {
    return NextResponse.json(
      { error: "ownerAddress is required" },
      { status: 400 }
    );
  }

  const conf = confidence_threshold != null
    ? Math.min(1, Math.max(0, parseFloat(String(confidence_threshold)) || 0.72))
    : 0.72;

  const agentConfig = {
    persona: typeof persona === "string" && persona.trim() ? persona.trim() : "autonomous execution agent",
    confidence_threshold: conf,
  };

  const { data: maxRow } = await supabase
    .from("agents")
    .select("token_id")
    .not("token_id", "is", null)
    .order("token_id", { ascending: false })
    .limit(1)
    .single();

  const nextTokenId = maxRow?.token_id != null ? Number(maxRow.token_id) + 1 : 1;

  const insertRow: Record<string, unknown> = {
    name: name?.trim() || `Agent #${nextTokenId}`,
    api_key: crypto.randomUUID(),
    balance: 0,
    token_id: nextTokenId,
    owner_address: ownerAddress,
    storage_pointer: DEMO_STORAGE_POINTER,
    blob_hash: DEMO_BLOB_HASH,
  };

  // Store config if agent_config column exists (JSONB)
  try {
    insertRow.agent_config = agentConfig;
  } catch {
    // column may not exist
  }

  const { data: agent, error } = await supabase
    .from("agents")
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create agent: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "Agent created (demo mode)",
      tokenId: nextTokenId,
      agent,
    },
    { status: 201 }
  );
}
