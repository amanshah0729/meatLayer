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

  // Trophy threshold: importance * 10 (e.g. importance 75 = need 750 trophies)
  const min_trophies = importanceLevel * 10;

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
