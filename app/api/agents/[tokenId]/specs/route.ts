import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/agents/:tokenId/specs — Agent config (persona, confidence_threshold) + list of humans (wallet addresses) who completed tasks for this agent
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const tokenIdNum = parseInt(tokenId, 10);
  if (Number.isNaN(tokenIdNum)) {
    return NextResponse.json({ error: "Invalid token_id" }, { status: 400 });
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, name, agent_config")
    .eq("token_id", tokenIdNum)
    .single();

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const config = (agent.agent_config as Record<string, unknown>) || {};
  const confidenceThreshold =
    typeof config.confidence_threshold === "number"
      ? config.confidence_threshold
      : typeof config.confidence_threshold === "string"
        ? parseFloat(config.confidence_threshold)
        : 0.72;
  const persona =
    typeof config.persona === "string" && config.persona
      ? config.persona
      : "autonomous execution agent";

  const { data: interactions, error: intError } = await supabase
    .from("agent_human_interactions")
    .select("user_id")
    .eq("token_id", tokenIdNum);

  if (intError) {
    return NextResponse.json(
      { error: "Failed to load humans", details: intError.message },
      { status: 500 }
    );
  }

  const userIds = [...new Set((interactions || []).map((r) => r.user_id))];
  let humans: { wallet_address: string }[] = [];

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("wallet_address")
      .in("id", userIds);

    if (!usersError && users) {
      humans = users.filter((u) => u.wallet_address) as { wallet_address: string }[];
    }
  }

  return NextResponse.json({
    agent_id: agent.id,
    name: agent.name,
    token_id: tokenIdNum,
    specs: {
      confidence_threshold: confidenceThreshold,
      persona,
      ...config,
    },
    humans_worked_with: humans.map((u) => u.wallet_address),
  });
}
