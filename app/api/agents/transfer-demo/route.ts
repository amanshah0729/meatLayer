import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { supabase } from "@/lib/supabase";

// POST /api/agents/transfer-demo — Transfer ownership in DB only (when FAKE_0G). No signature check.
// Body: { token_id, to_address, wallet_address } (signature/message optional, not verified)
export async function POST(request: Request) {
  if (process.env.FAKE_0G !== "true") {
    return NextResponse.json(
      { error: "Demo transfer only available when FAKE_0G=true" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { token_id, to_address, wallet_address } = body;

  if (token_id == null || !to_address?.trim() || !wallet_address) {
    return NextResponse.json(
      { error: "token_id, to_address, and wallet_address are required" },
      { status: 400 }
    );
  }

  const tokenIdStr = String(token_id);
  const toAddr = getAddress(to_address.trim());

  const { data: agent, error: fetchError } = await supabase
    .from("agents")
    .select("id, owner_address")
    .eq("token_id", parseInt(tokenIdStr, 10))
    .single();

  if (fetchError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (getAddress(agent.owner_address || "") !== getAddress(wallet_address)) {
    return NextResponse.json({ error: "You do not own this agent" }, { status: 401 });
  }

  const { error: updateError } = await supabase
    .from("agents")
    .update({ owner_address: toAddr })
    .eq("id", agent.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Transfer successful (demo)",
    token_id: parseInt(tokenIdStr, 10),
    new_owner: toAddr,
  });
}
