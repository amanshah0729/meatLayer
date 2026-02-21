import { NextResponse } from "next/server";
import { verifyMessage, getAddress } from "viem";
import { supabase } from "@/lib/supabase";
import { verifyOwnership } from "@/lib/nft-ownership";

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 min

// POST /api/agents/deposit — Record agent deposit (on-chain tx already completed by client)
// Auth: api_key (legacy) OR token_id + wallet_address + signature + message (iNFT)
export async function POST(request: Request) {
  const body = await request.json();
  const { api_key, token_id, wallet_address, signature, message, amount, tx_hash } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "amount must be greater than 0" },
      { status: 400 }
    );
  }

  let agent: { id: number; balance?: number } | null = null;

  if (api_key) {
    // === Legacy: api_key auth ===
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("api_key", api_key)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid api_key" }, { status: 401 });
    }
    agent = data;
  } else if (token_id != null && wallet_address && signature && message) {
    // === iNFT: token_id + signature auth ===
    const tokenIdStr = String(token_id);

    // 1. Verify signature (message must match expected format with recent timestamp)
    const msgMatch = message.match(/^meatlayer:deposit:(\d+):(\d+)$/);
    if (!msgMatch || msgMatch[1] !== tokenIdStr) {
      return NextResponse.json(
        { error: "Invalid message format. Expected: meatlayer:deposit:{token_id}:{timestamp}" },
        { status: 401 }
      );
    }
    const timestamp = parseInt(msgMatch[2], 10);
    if (Date.now() - timestamp > SIGNATURE_MAX_AGE_MS) {
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

    // 2. Verify NFT ownership on 0G
    const owns = await verifyOwnership(token_id, wallet_address);
    if (!owns) {
      return NextResponse.json({ error: "Wallet does not own this agent iNFT" }, { status: 401 });
    }

    // 3. Look up agent by token_id
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("token_id", parseInt(tokenIdStr, 10))
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Agent not found for this token_id" },
        { status: 404 }
      );
    }
    agent = data;
  } else {
    return NextResponse.json(
      { error: "Provide api_key (legacy) or token_id, wallet_address, signature, and message (iNFT)" },
      { status: 400 }
    );
  }

  const newBalance = (agent.balance || 0) + amount;

  const { error: updateError } = await supabase
    .from("agents")
    .update({ balance: newBalance })
    .eq("id", agent.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Deposit successful",
    previous_balance: agent.balance || 0,
    deposited: amount,
    new_balance: newBalance,
    ...(tx_hash && { tx_hash }),
  });
}
