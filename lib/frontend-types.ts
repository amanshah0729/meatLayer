export interface TaskPayload {
  task_type?: string;
  ai_confidence?: number;
  ai_action?: string;
  user_input?: string;
  ai_reasoning?: string;
  question?: string;
  image_url?: string;
  context?: { type: "text" | "image"; content: string };
  options?: Array<{
    id: string;
    label: string;
    image_url?: string;
    metadata?: Record<string, string>;
  }>;
  [key: string]: unknown;
}

export interface TaskRow {
  id: number;
  agent_id: number;
  input_payload: TaskPayload;
  importance_level: number;
  max_budget: number;
  required_workers: number;
  min_trophies: number;
  price_per_worker: number;
  est_price: number;
  trophy_reward: number;
  worker_instructions: string;
  expected_response_type: string;
  assigned_to: number | null;
  response: Record<string, unknown> | null;
  status: "open" | "assigned" | "completed";
  created_at: string;
}

export function getRiskFromImportance(importance: number): {
  label: string;
  color: string;
  dotColor: string;
} {
  if (importance >= 67) {
    return { label: "High risk", color: "text-red-600", dotColor: "bg-red-500" };
  }
  if (importance >= 34) {
    return { label: "Moderate risk", color: "text-amber-600", dotColor: "bg-amber-500" };
  }
  return { label: "Low risk", color: "text-green-600", dotColor: "bg-green-500" };
}

export function getConfidenceColor(confidence: number): string {
  if (confidence < 40) return "text-red-600";
  if (confidence < 70) return "text-amber-600";
  return "text-green-600";
}
