import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { TrustTier } from "@/lib/types";

// Trust tier hierarchy for filtering
const TIER_RANK: Record<TrustTier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  expert: 3,
};

// GET /api/workers/tasks?worker_id=xxx — Browse available tasks eligible for this worker
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get("worker_id");

  if (!workerId) {
    return NextResponse.json(
      { error: "worker_id query param is required" },
      { status: 400 }
    );
  }

  // Get the worker's trust tier
  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .select("id, trust_tier")
    .eq("id", workerId)
    .single();

  if (workerError || !worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  const workerRank = TIER_RANK[worker.trust_tier as TrustTier];

  // Get all pending tasks
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .in("status", ["pending", "assigned"])
    .order("created_at", { ascending: false });

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  // Filter by tier eligibility and open slots
  const eligible = (tasks || []).filter((task) => {
    const requiredRank = TIER_RANK[task.min_trust_tier as TrustTier];
    return workerRank >= requiredRank;
  });

  // For each eligible task, check if worker is already assigned and if slots remain
  const taskIds = eligible.map((t) => t.id);
  const { data: existingAssignments } = await supabase
    .from("task_assignments")
    .select("task_id, worker_id")
    .in("task_id", taskIds.length > 0 ? taskIds : ["none"]);

  const assignmentsByTask = new Map<string, string[]>();
  for (const a of existingAssignments || []) {
    const list = assignmentsByTask.get(a.task_id) || [];
    list.push(a.worker_id);
    assignmentsByTask.set(a.task_id, list);
  }

  const available = eligible.filter((task) => {
    const assigned = assignmentsByTask.get(task.id) || [];
    const hasOpenSlot = assigned.length < task.workers_needed;
    const notAlreadyClaimed = !assigned.includes(workerId);
    return hasOpenSlot && notAlreadyClaimed;
  });

  return NextResponse.json(available);
}
