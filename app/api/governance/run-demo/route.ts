import { NextResponse } from "next/server";
import { analyzeProposal } from "@/lib/ai";

/**
 * POST /api/governance/run-demo
 * Body: { token_id, wallet_address } (iNFT agent auth)
 * 1. Fetches latest Builder DAO proposal
 * 2. AI analyzes it (decision, confidence, reasoning)
 * 3. Sends to MeatLayer as "not confident enough — please review"
 */
export async function POST(request: Request) {
  let tokenId: number;
  let walletAddress: string;
  try {
    const body = await request.json();
    tokenId = Number(body.token_id);
    walletAddress = String(body.wallet_address || "").trim();
    if (!Number.isInteger(tokenId) || tokenId < 0 || !walletAddress) {
      return NextResponse.json(
        { error: "token_id and wallet_address are required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const base = new URL(request.url).origin;

  // 1. Fetch latest proposal
  const proposalRes = await fetch(`${base}/api/governance/latest`);
  if (!proposalRes.ok) {
    const err = await proposalRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error || "Failed to fetch proposal" },
      { status: proposalRes.status }
    );
  }
  const proposal = await proposalRes.json();
  if (proposal.proposalId == null && proposal.message) {
    return NextResponse.json(
      { error: proposal.message || "No proposals yet" },
      { status: 404 }
    );
  }

  // 2. AI analysis
  let analysis: { decision: string; confidence: number; reasoning: string };
  try {
    analysis = await analyzeProposal({
      title: proposal.title,
      description: proposal.description,
      proposalId: proposal.proposalId,
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      abstainVotes: proposal.abstainVotes,
    });
  } catch (err) {
    console.error("analyzeProposal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI analysis failed" },
      { status: 500 }
    );
  }

  // 3. Send to MeatLayer: "not confident enough — please review"
  const inputPayload = {
    type: "governance",
    proposalId: proposal.proposalId,
    title: proposal.title || `Proposal #${proposal.proposalId}`,
    description: proposal.description || "",
    forVotes: proposal.forVotes,
    againstVotes: proposal.againstVotes,
    abstainVotes: proposal.abstainVotes,
    analysis: {
      decision: analysis.decision,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
    },
    message:
      "Should Sarah or Aman get equity? Agent is not confident enough to vote. Please review the proposal and the AI analysis above, then decide (FOR / AGAINST / ABSTAIN).",
  };

  const humanTaskRes = await fetch(`${base}/api/human-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token_id: tokenId,
      wallet_address: walletAddress,
      input_payload: inputPayload,
      importance_level: 1,
      max_budget: 0.01,
    }),
  });

  const data = await humanTaskRes.json().catch(() => ({}));
  if (!humanTaskRes.ok) {
    return NextResponse.json(
      { error: data.error || "Failed to create human task" },
      { status: humanTaskRes.status }
    );
  }

  return NextResponse.json({
    ok: true,
    proposalId: proposal.proposalId,
    analysis: { decision: analysis.decision, confidence: analysis.confidence, reasoning: analysis.reasoning },
    task: data,
  });
}
