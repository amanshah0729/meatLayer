// === Database Row Types ===

export interface Task {
  id: string;
  input_payload: Record<string, unknown>;
  importance_level: number; // 1-100
  max_budget: number;
  required_workers: number;
  min_trophies: number;
  price_per_worker: number;
  est_price: number;
  worker_instructions: string;
  expected_response_type: string;
  status: "open" | "assigned" | "completed";
  created_at: string;
}

export interface User {
  id: string;
  wallet_address: string;
  username: string;
  trophies: number;
  tasks_done: number;
  escrow_balance: number;
  available_balance: number;
  created_at: string;
}

// === API Request Types ===

export interface CreateHumanTaskRequest {
  input_payload: Record<string, unknown>;
  importance_level: number; // 1-100
  max_budget: number;
}
