// === Enums ===

export type ImportanceLevel = "low" | "medium" | "high";

export type TaskStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "consensus"
  | "completed"
  | "expired"
  | "cancelled";

export type TrustTier = "bronze" | "silver" | "gold" | "expert";

export type InputType = "text" | "image" | "structured";

export type AssignmentStatus =
  | "assigned"
  | "in_progress"
  | "submitted"
  | "accepted"
  | "rejected";

// === Database Row Types ===

export interface ApiKey {
  id: string;
  key: string;
  owner_name: string;
  created_at: string;
}

export interface Task {
  id: string;
  requester_api_key_id: string;
  title: string;
  instructions: string;
  input_data: Record<string, unknown>;
  input_type: InputType;
  importance: ImportanceLevel;
  confidence_score: number;
  expected_response_format: Record<string, unknown> | null;
  payment_amount: string; // bigint as string
  escrow_tx_hash: string | null;
  status: TaskStatus;
  result: Record<string, unknown> | null;
  workers_needed: number;
  min_trust_tier: TrustTier;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface Worker {
  id: string;
  wallet_address: string;
  display_name: string;
  trust_score: number;
  trust_tier: TrustTier;
  total_completed: number;
  accuracy_rate: number;
  completion_rate: number;
  dispute_rate: number;
  specializations: string[];
  created_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  worker_id: string;
  status: AssignmentStatus;
  response: Record<string, unknown> | null;
  assigned_at: string;
  submitted_at: string | null;
}

export interface ReputationLog {
  id: string;
  worker_id: string;
  task_id: string;
  event_type: string;
  score_delta: number;
  created_at: string;
}

// === API Request/Response Types ===

export interface CreateTaskRequest {
  title: string;
  instructions: string;
  input_data: Record<string, unknown>;
  input_type: InputType;
  importance: ImportanceLevel;
  confidence_score: number;
  expected_response_format?: Record<string, unknown>;
  payment_amount: string;
}

export interface RegisterWorkerRequest {
  wallet_address: string;
  display_name: string;
  specializations?: string[];
}

export interface SubmitResponseRequest {
  response: Record<string, unknown>;
}

// === Routing Config ===

export interface RoutingConfig {
  workers_needed: number;
  min_trust_tier: TrustTier;
}
