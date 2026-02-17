import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { TrustTier } from "@/lib/types";

const TIER_RANK: Record<TrustTier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  expert: 3,
};

// POST /api/workers/tasks/:id/claim — Claim a task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const body = await request.json();
  const { worker_id } = body;

  if (!worker_id) {
    return NextResponse.json(
      { error: "worker_id is required" },
      { status: 400 }
    );
  }

  // Get the task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .in("status", ["pending", "assigned"])
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: "Task not found or not available" },
      { status: 404 }
    );
  }

  // Get the worker
  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .select("*")
    .eq("id", worker_id)
    .single();

  if (workerError || !worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  // Check trust tier eligibility
  if (
    TIER_RANK[worker.trust_tier as TrustTier] <
    TIER_RANK[task.min_trust_tier as TrustTier]
  ) {
    return NextResponse.json(
      { error: "Worker trust tier too low for this task" },
      { status: 403 }
    );
  }

  // Check available slots
  const { count } = await supabase
    .from("task_assignments")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId);

  if ((count || 0) >= task.workers_needed) {
    return NextResponse.json(
      { error: "All slots for this task are filled" },
      { status: 409 }
    );
  }

  // Create assignment
  const { data: assignment, error: assignError } = await supabase
    .from("task_assignments")
    .insert({
      task_id: taskId,
      worker_id,
      status: "assigned",
    })
    .select()
    .single();

  if (assignError) {
    if (assignError.code === "23505") {
      return NextResponse.json(
        { error: "Worker already claimed this task" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: assignError.message }, { status: 500 });
  }

  // Update task status to assigned if it was pending
  if (task.status === "pending") {
    await supabase
      .from("tasks")
      .update({ status: "assigned" })
      .eq("id", taskId);
  }

  return NextResponse.json(assignment, { status: 201 });
}
