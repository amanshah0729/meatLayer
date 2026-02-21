/**
 * Ping the AgentINFT contract on 0G testnet.
 * Usage: npx tsx scripts/ping-agent-inft.ts
 * Env: OG_RPC_URL or NEXT_PUBLIC_OG_RPC_URL (default: https://evmrpc-testnet.0g.ai)
 */

const CONTRACT_ADDRESS = "0x3C29D937B1B9D6DaBaC8CE733595F1cBB0E0b3DF" as const;
const RPC_URL = process.env.OG_RPC_URL || process.env.NEXT_PUBLIC_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";

const AGENT_INFT_ABI = [
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getStoragePointer", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getBlobHash", outputs: [{ type: "bytes32" }], stateMutability: "view", type: "function" },
] as const;

async function main() {
  const { createPublicClient, http } = await import("viem");
  const chain = {
    id: 16602,
    name: "0G Testnet",
    nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
    rpcUrls: { default: { http: [RPC_URL] } },
  };

  const client = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });

  console.log("Pinging AgentINFT at", CONTRACT_ADDRESS);
  console.log("RPC:", RPC_URL);
  console.log("");

  try {
    const [name, symbol, contractOwner] = await Promise.all([
      client.readContract({ address: CONTRACT_ADDRESS, abi: AGENT_INFT_ABI, functionName: "name" }),
      client.readContract({ address: CONTRACT_ADDRESS, abi: AGENT_INFT_ABI, functionName: "symbol" }),
      client.readContract({ address: CONTRACT_ADDRESS, abi: AGENT_INFT_ABI, functionName: "owner" }),
    ]);
    console.log("name():", name);
    console.log("symbol():", symbol);
    console.log("owner():", contractOwner);
    console.log("");

    // Try token 1 (first minted token)
    try {
      const ownerOf1 = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: AGENT_INFT_ABI,
        functionName: "ownerOf",
        args: [BigInt(1)],
      });
      const storagePtr = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: AGENT_INFT_ABI,
        functionName: "getStoragePointer",
        args: [BigInt(1)],
      });
      console.log("ownerOf(1):", ownerOf1);
      console.log("getStoragePointer(1):", storagePtr || "(empty)");
    } catch (e) {
      console.log("Token 1: not minted (ownerOf reverts for nonexistent token)");
    }

    console.log("");
    console.log("Contract is reachable and responding.");
  } catch (err) {
    console.error("Error pinging contract:", err);
    process.exit(1);
  }
}

main();
