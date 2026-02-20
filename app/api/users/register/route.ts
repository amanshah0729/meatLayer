import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/users/register — Register a new user with wallet address
export async function POST(request: Request) {
  const body = await request.json();
  const { wallet_address, username } = body;

  if (!wallet_address || !username) {
    return NextResponse.json(
      { error: "wallet_address and username are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ wallet_address, username })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "User with this wallet address already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
