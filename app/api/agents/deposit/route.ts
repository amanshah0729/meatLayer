import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/agents/deposit — Record agent deposit (on-chain tx already completed by client)
export async function POST(request: Request) {
  const body = await request.json();
  const { api_key, amount, tx_hash } = body;

  if (!api_key) {
    return NextResponse.json({ error: "api_key is required" }, { status: 400 });
  }

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "amount must be greater than 0" },
      { status: 400 }
    );
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("api_key", api_key)
    .single();

  if (agentError || !agent) {
    return NextResponse.json({ error: "Invalid api_key" }, { status: 401 });
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
