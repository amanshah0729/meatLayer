import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/agents/mine?wallet_address=0x...
// Returns agents owned by the wallet (owner_address match)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("wallet_address");

  if (!walletAddress) {
    return NextResponse.json(
      { error: "wallet_address is required" },
      { status: 400 }
    );
  }

  const addrLower = walletAddress.toLowerCase();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, token_id, owner_address, balance, storage_pointer, created_at")
    .not("token_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filtered = (data || []).filter(
    (a) => a.owner_address?.toLowerCase() === addrLower
  );

  // Most recently created first
  filtered.sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });

  return NextResponse.json(filtered);
}
