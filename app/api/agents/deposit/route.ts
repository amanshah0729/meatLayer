import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { supabase } from "@/lib/supabase";

// POST /api/agents/deposit — Record agent balance (off-chain). Auth: api_key (legacy) OR token_id + wallet_address (iNFT, DB owner check)
export async function POST(request: Request) {
  const body = await request.json();
  const { api_key, token_id, wallet_address, amount, tx_hash } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "amount must be greater than 0" },
      { status: 400 }
    );
  }

  let agent: { id: number; balance?: number } | null = null;

  if (api_key) {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("api_key", api_key)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid api_key" }, { status: 401 });
    }
    agent = data;
  } else if (token_id != null && wallet_address) {
    // iNFT: off-chain — verify owner in DB only
    const tokenIdStr = String(token_id);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("token_id", parseInt(tokenIdStr, 10))
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    if (getAddress(data.owner_address || "") !== getAddress(wallet_address)) {
      return NextResponse.json({ error: "Wallet does not own this agent" }, { status: 401 });
    }
    agent = data;
  } else {
    return NextResponse.json(
      { error: "Provide api_key (legacy) or token_id + wallet_address (iNFT)" },
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
