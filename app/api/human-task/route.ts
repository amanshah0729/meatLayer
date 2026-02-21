import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { supabase } from "@/lib/supabase";
import { calculateRouting } from "@/lib/routing";
import { analyzeTask } from "@/lib/ai";

// POST /api/human-task — AI agent submits a task for human assistance (off-chain for iNFT).
// Auth: api_key (legacy) OR token_id + wallet_address (iNFT, DB owner check)
export async function POST(request: Request) {
  const body = await request.json();
  const { api_key, token_id, wallet_address, input_payload, importance_level, max_budget } = body;

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

  // Validate payload
  if (!input_payload || !importance_level || !max_budget) {
    return NextResponse.json(
      { error: "input_payload, importance_level, and max_budget are required" },
      { status: 400 }
    );
  }

  if (importance_level < 1 || importance_level > 100) {
    return NextResponse.json(
      { error: "importance_level must be between 1 and 100" },
      { status: 400 }
    );
  }

  if (max_budget <= 0) {
    return NextResponse.json(
      { error: "max_budget must be greater than 0" },
      { status: 400 }
    );
  }

  // 1. AI analyzes the task and generates worker instructions + metadata
  const analysis = await analyzeTask(input_payload);

  // 2. Platform calculates workers, pricing, and trophy threshold
  const routing = calculateRouting(importance_level, max_budget);

  const estPrice = routing.estimated_price;

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Deduct balance from agent (task is created regardless)
  const newBalance = (agent.balance || 0) - estPrice;
  const { error: deductError } = await supabase
    .from("agents")
    .update({ balance: newBalance })
    .eq("id", agent.id);

  if (deductError) {
    return NextResponse.json(
      { error: "Failed to deduct balance: " + deductError.message },
      { status: 500 }
    );
  }

  // 5. Insert enriched task into Supabase
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      input_payload,
      importance_level,
      max_budget,
      required_workers: routing.required_workers,
      min_trophies: routing.min_trophies,
      price_per_worker: routing.price_per_worker,
      est_price: routing.estimated_price,
      trophy_reward: routing.trophy_reward,
      worker_instructions: analysis.worker_instructions,
      expected_response_type: analysis.expected_response_type,
      status: "open",
      agent_id: agent.id,
    })
    .select()
    .single();

  if (error) {
    // Refund the agent if task creation failed
    await supabase
      .from("agents")
      .update({ balance: agent.balance || 0 })
      .eq("id", agent.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ...data,
      agent_balance_remaining: newBalance,
    },
    { status: 201 }
  );
}
