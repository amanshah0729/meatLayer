import { ImportanceLevel, RoutingConfig } from "./types";

const ROUTING_MAP: Record<ImportanceLevel, RoutingConfig> = {
  low: { workers_needed: 1, min_trust_tier: "bronze" },
  medium: { workers_needed: 3, min_trust_tier: "silver" },
  high: { workers_needed: 5, min_trust_tier: "gold" },
};

export function getRoutingConfig(importance: ImportanceLevel): RoutingConfig {
  return ROUTING_MAP[importance];
}
