import { NextResponse } from "next/server";
import { runConsensusFlow } from "@/lib/consensus";

// POST /api/consensus/evaluate — Manually trigger consensus evaluation
export async function POST(request: Request) {
  const body = await request.json();
  const { task_id } = body;

  if (!task_id) {
    return NextResponse.json(
      { error: "task_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await runConsensusFlow(task_id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
