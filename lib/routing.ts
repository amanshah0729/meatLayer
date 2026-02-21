/**
 * Platform-calculated routing based on importance_level (1-100).
 * Derives required_workers, price_per_worker, and min_trophies.
 */

interface RoutingResult {
  required_workers: number;
  price_per_worker: number;
  min_trophies: number;
  estimated_price: number;
}

export function calculateRouting(
  importanceLevel: number,
  maxBudget: number
): RoutingResult {
  // Workers scale with importance: 1 (low), 3 (mid), 5 (high)
  let required_workers: number;
  if (importanceLevel < 33) {
    required_workers = 1;
  } else if (importanceLevel < 66) {
    required_workers = 3;
  } else {
    required_workers = 5;
  }

  // Trophy tiers — exponential scaling
  // 0-10: 0, 10-20: 10, 20-30: 25, 30-40: 60, 40-50: 150,
  // 50-60: 350, 60-70: 800, 70-80: 1800, 80-90: 4000, 90-100: 10000
  const trophyTiers = [0, 10, 25, 60, 150, 350, 800, 1800, 4000, 10000];
  const tierIndex = Math.min(Math.floor(importanceLevel / 10), 9);
  const min_trophies = trophyTiers[tierIndex];

  // Split budget evenly across workers
  const price_per_worker = Math.floor((maxBudget / required_workers) * 100) / 100;
  const estimated_price = price_per_worker * required_workers;

  return {
    required_workers,
    price_per_worker,
    min_trophies,
    estimated_price,
  };
}
