import { NextResponse } from "next/server";
import { verifyMessage, getAddress } from "viem";
import { supabase } from "@/lib/supabase";

const SIGNATURE_MAX_AGE_MS = 15 * 60 * 1000; // 15 min

// POST /api/agents/transfer-demo — Transfer ownership in DB only (when FAKE_0G)
// Body: { token_id, to_address, wallet_address, signature, message }
export async function POST(request: Request) {
  if (process.env.FAKE_0G !== "true") {
    return NextResponse.json(
      { error: "Demo transfer only available when FAKE_0G=true" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { token_id, to_address, wallet_address, signature, message } = body;

  if (token_id == null || !to_address?.trim() || !wallet_address || !signature || !message) {
    return NextResponse.json(
      { error: "token_id, to_address, wallet_address, signature, and message are required" },
      { status: 400 }
    );
  }

  const tokenIdStr = String(token_id);
  const toAddr = getAddress(to_address.trim());

  // Message format: meatlayer:transfer:{token_id}:{to_address}:{timestamp}
  const msgMatch = message.match(/^meatlayer:transfer:(\d+):(0x[a-fA-F0-9]{40}):(\d+)$/);
  if (!msgMatch || msgMatch[1] !== tokenIdStr || getAddress(msgMatch[2]) !== toAddr) {
    return NextResponse.json(
      { error: "Invalid message format" },
      { status: 401 }
    );
  }
  const timestamp = parseInt(msgMatch[3], 10);
  if (Date.now() - timestamp * 1000 > SIGNATURE_MAX_AGE_MS) {
    return NextResponse.json({ error: "Signature expired" }, { status: 401 });
  }

  let recovered: `0x${string}`;
  try {
    recovered = await verifyMessage({ message, signature });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (getAddress(recovered) !== getAddress(wallet_address)) {
    return NextResponse.json({ error: "Signature does not match wallet" }, { status: 401 });
  }

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
