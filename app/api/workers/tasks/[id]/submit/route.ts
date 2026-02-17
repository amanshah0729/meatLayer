import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runConsensusFlow } from "@/lib/consensus";

// POST /api/workers/tasks/:id/submit — Submit a response for a task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const body = await request.json();
  const { worker_id, response } = body;

  if (!worker_id || !response) {
    return NextResponse.json(
      { error: "worker_id and response are required" },
      { status: 400 }
    );
  }

  // Find the assignment
  const { data: assignment, error: assignError } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("task_id", taskId)
    .eq("worker_id", worker_id)
    .single();

  if (assignError || !assignment) {
    return NextResponse.json(
      { error: "No assignment found for this worker and task" },
      { status: 404 }
    );
  }

  if (assignment.status === "submitted") {
    return NextResponse.json(
      { error: "Response already submitted" },
      { status: 409 }
    );
  }

  // Update the assignment with the response
  const { error: updateError } = await supabase
    .from("task_assignments")
    .update({
      status: "submitted",
      response,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", assignment.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Update task to in_progress
  await supabase
    .from("tasks")
    .update({ status: "in_progress" })
    .eq("id", taskId)
    .in("status", ["pending", "assigned"]);

  // Check if all slots have submitted — if so, trigger consensus
  const { data: task } = await supabase
    .from("tasks")
    .select("workers_needed, importance")
    .eq("id", taskId)
    .single();

  const { count: submittedCount } = await supabase
    .from("task_assignments")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId)
    .eq("status", "submitted");

  let consensusResult = null;

  if (task && (submittedCount || 0) >= task.workers_needed) {
    consensusResult = await runConsensusFlow(taskId);
  }

  return NextResponse.json({
    message: "Response submitted",
    assignment_id: assignment.id,
    consensus: consensusResult,
  });
}
