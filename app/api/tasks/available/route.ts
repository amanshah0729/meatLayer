import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/tasks/available?user_id=xxx — Get tasks eligible for this worker
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "user_id query param is required" },
      { status: 400 }
    );
  }

  // Get the worker's trophies
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, trophies")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const trophies = user.trophies || 0;

  // Find open tasks where this worker's trophies fall in the eligible range
  // Eligible: trophies >= min_trophies AND trophies <= min_trophies + 100
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "open")
    .lte("min_trophies", trophies)
    .gt("min_trophies", trophies - 100)
    .order("created_at", { ascending: false });

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  return NextResponse.json(tasks || []);
}
