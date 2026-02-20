import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/leaderboard — Worker rankings
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sort") || "trust_score";
  const limit = parseInt(searchParams.get("limit") || "50");

  const validSorts = ["trust_score", "accuracy_rate", "total_completed"];
  const sort = validSorts.includes(sortBy) ? sortBy : "trust_score";

  const { data, error } = await supabase
    .from("workers")
    .select(
      "id, display_name, wallet_address, trust_score, trust_tier, total_completed, accuracy_rate, specializations"
    )
    .order(sort, { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add rank numbers
  const ranked = (data || []).map((worker, idx) => ({
    rank: idx + 1,
    ...worker,
  }));

  return NextResponse.json(ranked);
}
