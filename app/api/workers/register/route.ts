import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { RegisterWorkerRequest } from "@/lib/types";

// POST /api/workers/register — Register a new worker
export async function POST(request: Request) {
  const body: RegisterWorkerRequest = await request.json();
  const { wallet_address, display_name, specializations } = body;

  if (!wallet_address || !display_name) {
    return NextResponse.json(
      { error: "wallet_address and display_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("workers")
    .insert({
      wallet_address,
      display_name,
      specializations: specializations || [],
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Worker with this wallet address already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
