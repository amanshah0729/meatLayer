import { supabase } from "./supabase";
import { TrustTier } from "./types";

const TIER_THRESHOLDS: { tier: TrustTier; min_score: number }[] = [
  { tier: "expert", min_score: 0.9 },
  { tier: "gold", min_score: 0.75 },
  { tier: "silver", min_score: 0.5 },
  { tier: "bronze", min_score: 0 },
];

function getTierForScore(score: number): TrustTier {
  for (const t of TIER_THRESHOLDS) {
    if (score >= t.min_score) return t.tier;
  }
  return "bronze";
}

/**
 * After consensus is reached, update reputations for all involved workers.
 * Accepted workers get a positive delta, rejected get negative.
 */
export async function updateReputationAfterConsensus(
  taskId: string,
  acceptedAssignmentIds: string[],
  rejectedAssignmentIds: string[]
) {
  // Get accepted assignments with worker_ids
  const allIds = [...acceptedAssignmentIds, ...rejectedAssignmentIds];
  if (allIds.length === 0) return;

  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("id, worker_id")
    .in("id", allIds);

  if (!assignments) return;

  const acceptedSet = new Set(acceptedAssignmentIds);

  for (const assignment of assignments) {
    const isAccepted = acceptedSet.has(assignment.id);
    const scoreDelta = isAccepted ? 0.02 : -0.03;
    const eventType = isAccepted ? "task_accepted" : "task_rejected";

    // Log the reputation event
    await supabase.from("reputation_logs").insert({
      worker_id: assignment.worker_id,
      task_id: taskId,
      event_type: eventType,
      score_delta: scoreDelta,
    });

    // Get current worker stats
    const { data: worker } = await supabase
      .from("workers")
      .select("*")
      .eq("id", assignment.worker_id)
      .single();

    if (!worker) continue;

    const newTotalCompleted = worker.total_completed + 1;
    const newTrustScore = Math.max(0, Math.min(1, worker.trust_score + scoreDelta));
    const newTier = getTierForScore(newTrustScore);

    // Recalculate accuracy rate
    const newAccuracyRate = isAccepted
      ? (worker.accuracy_rate * worker.total_completed + 1) / newTotalCompleted
      : (worker.accuracy_rate * worker.total_completed) / newTotalCompleted;

    await supabase
      .from("workers")
      .update({
        trust_score: newTrustScore,
        trust_tier: newTier,
        total_completed: newTotalCompleted,
        accuracy_rate: Math.round(newAccuracyRate * 1000) / 1000,
        completion_rate: Math.round(
          ((worker.completion_rate * worker.total_completed + 1) / newTotalCompleted) * 1000
        ) / 1000,
      })
      .eq("id", assignment.worker_id);

    // Log tier change if it happened
    if (newTier !== worker.trust_tier) {
      await supabase.from("reputation_logs").insert({
        worker_id: assignment.worker_id,
        task_id: taskId,
        event_type: `tier_change_${worker.trust_tier}_to_${newTier}`,
        score_delta: 0,
      });
    }
  }
}
