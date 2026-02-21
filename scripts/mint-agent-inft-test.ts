/**
 * Mint one test Agent iNFT on 0G testnet (contract owner only).
 *
 * Usage:
 *   npx tsx scripts/mint-agent-inft-test.ts [recipient_address]
 *   (default recipient = deployer wallet)
 *
 * Env: DEPLOYER_PRIVATE_KEY or MONAD_PRIVATE_KEY
 *      OG_RPC_URL (default: https://evmrpc-testnet.0g.ai)
 */

const CONTRACT_ADDRESS = "0x3C29D937B1B9D6DaBaC8CE733595F1cBB0E0b3DF" as const;
const RPC_URL = process.env.OG_RPC_URL || process.env.NEXT_PUBLIC_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";

const AGENT_INFT_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "storagePointer", type: "string" },
      { name: "blobHash", type: "bytes32" },
    ],
    name: "mintAgent",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY || process.env.MONAD_PRIVATE_KEY;
  if (!pk) {
    console.error("Set DEPLOYER_PRIVATE_KEY or MONAD_PRIVATE_KEY in env");
    process.exit(1);
  }
  const key = pk.trim().startsWith("0x") ? pk.trim() : `0x${pk.trim()}`;

  const { createWalletClient, createPublicClient, http, keccak256, toHex } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");

  const chain = {
    id: 16602,
    name: "0G Testnet",
    nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
    rpcUrls: { default: { http: [RPC_URL] } },
  };

  const account = privateKeyToAccount(key as `0x${string}`);
  const recipient = process.argv[2] || account.address;

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
  });
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });

  const storagePointer = "test-demo";
  const blobHash = keccak256(toHex("test-blob"));

  console.log("Minting test Agent iNFT");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Recipient:", recipient);
  console.log("Storage pointer:", storagePointer);
  console.log("");

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: AGENT_INFT_ABI,
    functionName: "mintAgent",
    args: [recipient as `0x${string}`, storagePointer, blobHash],
  });
  console.log("Tx hash:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Block:", receipt.blockNumber);

  const logs = receipt.logs;
  const mintTopic = keccak256(toHex("AgentMinted(uint256,address,string)"));
  const mintLog = logs.find((l) => l.topics[0] === mintTopic);
  if (mintLog && mintLog.topics[1]) {
    const tokenId = BigInt(mintLog.topics[1]);
    console.log("Minted token ID:", tokenId.toString());
  }

  console.log("");
  console.log("Verify on 0G testnet explorer:");
  console.log("  Tx:    https://chainscan-galileo.0g.ai/tx/" + hash);
  console.log("  NFT:   https://chainscan-galileo.0g.ai/address/" + CONTRACT_ADDRESS);
  console.log("");
  console.log("Run npx tsx scripts/ping-agent-inft.ts to verify from CLI.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
