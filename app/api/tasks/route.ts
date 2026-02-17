import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey } from "@/lib/auth";
import { getRoutingConfig } from "@/lib/routing";
import { CreateTaskRequest } from "@/lib/types";

// POST /api/tasks — Create a new task
export async function POST(request: Request) {
  const apiKeyId = await validateApiKey(request);
  if (!apiKeyId) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body: CreateTaskRequest = await request.json();
  const {
    title,
    instructions,
    input_data,
    input_type,
    importance,
    confidence_score,
    expected_response_format,
    payment_amount,
  } = body;

  if (!title || !instructions || !importance) {
    return NextResponse.json(
      { error: "title, instructions, and importance are required" },
      { status: 400 }
    );
  }

  const routing = getRoutingConfig(importance);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      requester_api_key_id: apiKeyId,
      title,
      instructions,
      input_data: input_data || {},
      input_type: input_type || "text",
      importance,
      confidence_score: confidence_score || 0,
      expected_response_format: expected_response_format || null,
      payment_amount: payment_amount || "0",
      workers_needed: routing.workers_needed,
      min_trust_tier: routing.min_trust_tier,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET /api/tasks — List tasks for the authenticated agent
export async function GET(request: Request) {
  const apiKeyId = await validateApiKey(request);
  if (!apiKeyId) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("requester_api_key_id", apiKeyId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
