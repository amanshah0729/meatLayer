import { supabase } from "./supabase";
import { ImportanceLevel, TaskAssignment } from "./types";
import { updateReputationAfterConsensus } from "./reputation";

interface ConsensusResult {
  reached: boolean;
  result: Record<string, unknown> | null;
  accepted_assignments: string[];
  rejected_assignments: string[];
}

/**
 * Run consensus on a task based on its importance level.
 * Returns whether consensus was reached and the final result.
 */
export async function evaluateConsensus(
  taskId: string,
  importance: ImportanceLevel,
  assignments: TaskAssignment[]
): Promise<ConsensusResult> {
  const submitted = assignments.filter((a) => a.status === "submitted");

  switch (importance) {
    case "low":
      return evaluateLow(submitted);
    case "medium":
      return evaluateMedium(taskId, submitted);
    case "high":
      return evaluateHigh(taskId, submitted);
  }
}

/**
 * Low importance: auto-accept the single response.
 */
function evaluateLow(submitted: TaskAssignment[]): ConsensusResult {
  if (submitted.length === 0) {
    return { reached: false, result: null, accepted_assignments: [], rejected_assignments: [] };
  }

  return {
    reached: true,
    result: submitted[0].response,
    accepted_assignments: [submitted[0].id],
    rejected_assignments: [],
  };
}

/**
 * Medium importance: majority vote. Responses are grouped by their
 * JSON-stringified value — the group with the most votes wins.
 */
function evaluateMedium(
  taskId: string,
  submitted: TaskAssignment[]
): ConsensusResult {
  if (submitted.length < 2) {
    return { reached: false, result: null, accepted_assignments: [], rejected_assignments: [] };
  }

  const groups = groupByResponse(submitted);
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  const [topKey, topGroup] = sorted[0];

  // Majority = more than half
  if (topGroup.length > submitted.length / 2) {
    const acceptedIds = topGroup.map((a) => a.id);
    const rejectedIds = submitted.filter((a) => !acceptedIds.includes(a.id)).map((a) => a.id);

    return {
      reached: true,
      result: JSON.parse(topKey),
      accepted_assignments: acceptedIds,
      rejected_assignments: rejectedIds,
    };
  }

  return { reached: false, result: null, accepted_assignments: [], rejected_assignments: [] };
}

/**
 * High importance: weighted vote by worker trust scores.
 * Each worker's vote is weighted by their trust_score.
 * The group with >60% of total weight wins.
 */
async function evaluateHigh(
  taskId: string,
  submitted: TaskAssignment[]
): Promise<ConsensusResult> {
  if (submitted.length < 3) {
    return { reached: false, result: null, accepted_assignments: [], rejected_assignments: [] };
  }

  // Fetch trust scores for all workers
  const workerIds = submitted.map((a) => a.worker_id);
  const { data: workers } = await supabase
    .from("workers")
    .select("id, trust_score")
    .in("id", workerIds);

  const trustMap = new Map<string, number>();
  for (const w of workers || []) {
    trustMap.set(w.id, w.trust_score);
  }

  // Group responses and sum weights
  const groups = groupByResponse(submitted);
  const totalWeight = submitted.reduce(
    (sum, a) => sum + (trustMap.get(a.worker_id) || 0.5),
    0
  );

  let bestKey = "";
  let bestWeight = 0;
  let bestGroup: TaskAssignment[] = [];

  for (const [key, group] of groups.entries()) {
    const weight = group.reduce(
      (sum, a) => sum + (trustMap.get(a.worker_id) || 0.5),
      0
    );
    if (weight > bestWeight) {
      bestWeight = weight;
      bestKey = key;
      bestGroup = group;
    }
  }

  // Need >60% weighted agreement
  if (bestWeight / totalWeight >= 0.6) {
    const acceptedIds = bestGroup.map((a) => a.id);
    const rejectedIds = submitted.filter((a) => !acceptedIds.includes(a.id)).map((a) => a.id);

    return {
      reached: true,
      result: JSON.parse(bestKey),
      accepted_assignments: acceptedIds,
      rejected_assignments: rejectedIds,
    };
  }

  return { reached: false, result: null, accepted_assignments: [], rejected_assignments: [] };
}

/**
 * Group assignments by their JSON-stringified response.
 */
function groupByResponse(
  assignments: TaskAssignment[]
): Map<string, TaskAssignment[]> {
  const groups = new Map<string, TaskAssignment[]>();
  for (const a of assignments) {
    const key = JSON.stringify(a.response || {});
    const group = groups.get(key) || [];
    group.push(a);
    groups.set(key, group);
  }
  return groups;
}

/**
 * Full consensus flow: evaluate, update task + assignments, update reputation.
 */
export async function runConsensusFlow(taskId: string): Promise<{
  reached: boolean;
  result: Record<string, unknown> | null;
}> {
  // Get the task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) {
    throw new Error("Task not found");
  }

  // Get all assignments
  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("task_id", taskId);

  if (!assignments || assignments.length === 0) {
    return { reached: false, result: null };
  }

  const consensus = await evaluateConsensus(
    taskId,
    task.importance,
    assignments
  );

  if (consensus.reached) {
    // Update task as completed
    await supabase
      .from("tasks")
      .update({
        status: "completed",
        result: consensus.result,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    // Mark accepted assignments
    if (consensus.accepted_assignments.length > 0) {
      await supabase
        .from("task_assignments")
        .update({ status: "accepted" })
        .in("id", consensus.accepted_assignments);
    }

    // Mark rejected assignments
    if (consensus.rejected_assignments.length > 0) {
      await supabase
        .from("task_assignments")
        .update({ status: "rejected" })
        .in("id", consensus.rejected_assignments);
    }

    // Update reputations
    await updateReputationAfterConsensus(taskId, consensus.accepted_assignments, consensus.rejected_assignments);

    return { reached: true, result: consensus.result };
  } else {
    // Update task to consensus status (waiting for more/better responses)
    await supabase
      .from("tasks")
      .update({ status: "consensus" })
      .eq("id", taskId);

    return { reached: false, result: null };
  }
}
