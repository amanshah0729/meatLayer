import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/workers/profile?worker_id=xxx — Get worker profile
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get("worker_id");

  if (!workerId) {
    return NextResponse.json(
      { error: "worker_id query param is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", workerId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  // Get recent reputation logs
  const { data: reputationLogs } = await supabase
    .from("reputation_logs")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    ...data,
    recent_reputation_logs: reputationLogs || [],
  });
}
