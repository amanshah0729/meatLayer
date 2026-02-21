import { createPublicClient, http, getAddress } from "viem";
import { AGENT_INFT_ADDRESS, OG_RPC_URL } from "@/lib/contracts";

const OG_CHAIN = {
  id: 16602,
  name: "0G Testnet",
  nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
  rpcUrls: { default: { http: [OG_RPC_URL || "https://evmrpc-testnet.0g.ai"] } },
} as const;

const AGENT_INFT_ABI = [
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const client = createPublicClient({
  chain: OG_CHAIN,
  transport: http(OG_RPC_URL || "https://evmrpc-testnet.0g.ai"),
});

/**
 * Verify that the given address owns the AgentINFT token on 0G testnet.
 */
export async function verifyOwnership(
  tokenId: number | bigint,
  ownerAddress: string
): Promise<boolean> {
  const owner = await client.readContract({
    address: AGENT_INFT_ADDRESS as `0x${string}`,
    abi: AGENT_INFT_ABI,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });
  return getAddress(owner) === getAddress(ownerAddress);
}
