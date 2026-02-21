import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/tasks/:id/complete — Worker submits completed task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const body = await request.json();
  const { user_id, response } = body;

  if (!user_id || !response) {
    return NextResponse.json(
      { error: "user_id and response are required" },
      { status: 400 }
    );
  }

  // Get the task — must be assigned to this user
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("status", "assigned")
    .eq("assigned_to", user_id)
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: "Task not found, not assigned to you, or already completed" },
      { status: 404 }
    );
  }

  // Update task to completed with the worker's response
  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      response,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Increment worker's available_balance by price_per_worker and tasks_done
  const { data: user } = await supabase
    .from("users")
    .select("available_balance, tasks_done, trophies")
    .eq("id", user_id)
    .single();

  const trophiesEarned = task.trophy_reward || 10;

  if (user) {
    await supabase
      .from("users")
      .update({
        available_balance: (user.available_balance || 0) + task.price_per_worker,
        tasks_done: (user.tasks_done || 0) + 1,
        trophies: (user.trophies || 0) + trophiesEarned,
      })
      .eq("id", user_id);
  }

  return NextResponse.json({
    task: updatedTask,
    payout: task.price_per_worker,
    trophies_earned: trophiesEarned,
  });
}
