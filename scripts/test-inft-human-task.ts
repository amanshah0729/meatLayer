/**
 * Test iNFT auth for POST /api/human-task
 *
 * Usage:
 *   npx tsx scripts/test-inft-human-task.ts <token_id>
 *
 * Env: DEPLOYER_PRIVATE_KEY or MONAD_PRIVATE_KEY (wallet that owns the iNFT)
 *      BASE_URL (default: http://localhost:3000)
 *
 * Example:
 *   DEPLOYER_PRIVATE_KEY=0x... npx tsx scripts/test-inft-human-task.ts 1
 */

import { privateKeyToAccount } from "viem/accounts";

const tokenId = process.argv[2] || "1";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.MONAD_PRIVATE_KEY;
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

if (!privateKey) {
  console.error("Set DEPLOYER_PRIVATE_KEY or MONAD_PRIVATE_KEY in env");
  process.exit(1);
}

const message = `meatlayer:human-task:${tokenId}:${Math.floor(Date.now() / 1000)}`;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY || process.env.MONAD_PRIVATE_KEY;
  if (!pk) {
    console.error("Set DEPLOYER_PRIVATE_KEY or MONAD_PRIVATE_KEY in env");
    process.exit(1);
  }
  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`
  );

  const signature = await account.signMessage({ message });

  const body = {
    token_id: parseInt(tokenId, 10),
    wallet_address: account.address,
    signature,
    message,
    input_payload: {
      question: "Test iNFT human-task?",
      task_type: "Verification",
      ai_confidence: 50,
    },
    importance_level: 25,
    max_budget: 5,
  };

  console.log("POST", `${baseUrl}/api/human-task`);
  console.log("token_id:", tokenId, "wallet:", account.address);
  console.log("message:", message);
  console.log("");

  const res = await fetch(`${baseUrl}/api/human-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error:", res.status, data);
    process.exit(1);
  }
  console.log("Success:", JSON.stringify(data, null, 2));
}

main();
