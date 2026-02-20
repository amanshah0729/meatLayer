import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateRouting } from "@/lib/routing";
import { analyzeTask } from "@/lib/ai";
import { CreateHumanTaskRequest } from "@/lib/types";

// POST /api/human-task — AI agent submits a task for human assistance
export async function POST(request: Request) {
  const body: CreateHumanTaskRequest & { api_key?: string } = await request.json();
  const { api_key, input_payload, importance_level, max_budget } = body;

  // Auth: require api_key
  if (!api_key) {
    return NextResponse.json(
      { error: "api_key is required" },
      { status: 401 }
    );
  }

  // Look up the agent
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("api_key", api_key)
    .single();

  if (agentError || !agent) {
    return NextResponse.json(
      { error: "Invalid api_key" },
      { status: 401 }
    );
  }

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

  // 3. Check agent has enough balance
  const estPrice = routing.estimated_price;
  if ((agent.balance || 0) < estPrice) {
    return NextResponse.json(
      {
        error: "Insufficient balance",
        balance: agent.balance || 0,
        est_price: estPrice,
      },
      { status: 402 }
    );
  }

  // 4. Deduct balance from agent
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
      .update({ balance: (agent.balance || 0) })
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
