import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { withdrawFromVault } from "@/lib/vault";
import { ethers } from "ethers";

const MIN_CASHOUT = 5;

// POST /api/users/cashout — Worker cashes out their available balance
export async function POST(request: Request) {
  const body = await request.json();
  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json(
      { error: "user_id is required" },
      { status: 400 }
    );
  }

  // Get the user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user_id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const balance = user.available_balance || 0;

  if (balance < MIN_CASHOUT) {
    return NextResponse.json(
      { error: `Minimum cashout is $${MIN_CASHOUT}. Current balance: $${balance}` },
      { status: 400 }
    );
  }

  if (!user.wallet_address) {
    return NextResponse.json(
      { error: "No wallet address on file" },
      { status: 400 }
    );
  }

  // Convert dollar amount to wei (using 1 MON = $1 for simplicity in hackathon)
  const amountWei = ethers.parseEther(balance.toString()).toString();

  try {
    // Call the vault contract to send funds to the worker
    const txHash = await withdrawFromVault(user.wallet_address, amountWei);

    // Zero out their available balance in the DB
    await supabase
      .from("users")
      .update({ available_balance: 0 })
      .eq("id", user_id);

    return NextResponse.json({
      message: "Cashout successful",
      amount: balance,
      tx_hash: txHash,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `On-chain withdrawal failed: ${message}` },
      { status: 500 }
    );
  }
}
