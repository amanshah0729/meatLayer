import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/tasks/:id/accept — Worker accepts a task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const body = await request.json();
  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json(
      { error: "user_id is required" },
      { status: 400 }
    );
  }

  // Get the task — must be open
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("status", "open")
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: "Task not found or already assigned" },
      { status: 404 }
    );
  }

  // Get the worker
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, trophies")
    .eq("id", user_id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check trophy eligibility
  const trophies = user.trophies || 0;
  if (trophies < task.min_trophies || trophies > task.min_trophies + 100) {
    return NextResponse.json(
      { error: "Not eligible for this task based on trophies" },
      { status: 403 }
    );
  }

  // Assign the task to this worker
  const { data: updated, error: updateError } = await supabase
    .from("tasks")
    .update({
      status: "assigned",
      assigned_to: user_id,
    })
    .eq("id", taskId)
    .eq("status", "open")
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Task was already taken by another worker" },
      { status: 409 }
    );
  }

  return NextResponse.json(updated);
}
