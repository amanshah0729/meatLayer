import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey } from "@/lib/auth";

// GET /api/tasks/:id — Poll task status and result
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKeyId = await validateApiKey(request);
  if (!apiKeyId) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("requester_api_key_id", apiKeyId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Include assignment info if task is in progress
  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("id, worker_id, status, submitted_at")
    .eq("task_id", id);

  return NextResponse.json({
    ...data,
    assignments: assignments || [],
  });
}
