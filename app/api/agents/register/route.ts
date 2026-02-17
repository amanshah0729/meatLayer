import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/agents/register — Create a new AI agent account
export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({ name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: "Agent created. Save your api_key — it won't be shown again.",
      agent: data,
    },
    { status: 201 }
  );
}
