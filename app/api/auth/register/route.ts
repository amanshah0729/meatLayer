import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { owner_name } = body;

  if (!owner_name) {
    return NextResponse.json(
      { error: "owner_name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ owner_name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    api_key: data.key,
    owner_name: data.owner_name,
    created_at: data.created_at,
  });
}
