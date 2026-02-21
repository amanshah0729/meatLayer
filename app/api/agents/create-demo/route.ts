import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { supabase } from "@/lib/supabase";
import { AGENT_INFT_ADDRESS, OG_RPC_URL } from "@/lib/contracts";
import { createWalletClient, createPublicClient, http } from "viem";

const DEMO_STORAGE_POINTER = "demo";
const DEMO_BLOB_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

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

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.MONAD_PRIVATE_KEY;

// POST /api/agents/create-demo — Create agent in DB only, then user funds on-chain
// Body: { ownerAddress, name, persona?, confidence_threshold? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerAddress, name, persona, confidence_threshold } = body;

    if (!ownerAddress) {
      return NextResponse.json(
        { error: "ownerAddress is required" },
        { status: 400 }
      );
    }

    const conf = confidence_threshold != null
      ? Math.min(1, Math.max(0, parseFloat(String(confidence_threshold)) || 0.72))
      : 0.72;

    const agentConfig = {
      persona: typeof persona === "string" && persona.trim() ? persona.trim() : "autonomous execution agent",
      confidence_threshold: conf,
    };

    const { data: maxRow } = await supabase
      .from("agents")
      .select("token_id")
      .not("token_id", "is", null)
      .order("token_id", { ascending: false })
      .limit(1)
      .single();

    const nextTokenId = maxRow?.token_id != null ? Number(maxRow.token_id) + 1 : 1;

    const insertRow: Record<string, unknown> = {
      name: name?.trim() || `Agent #${nextTokenId}`,
      api_key: crypto.randomUUID(),
      balance: 0,
      token_id: nextTokenId,
      owner_address: ownerAddress,
      storage_pointer: DEMO_STORAGE_POINTER,
      blob_hash: DEMO_BLOB_HASH,
    };

    try {
      insertRow.agent_config = agentConfig;
    } catch {
      // column may not exist
    }

    const { data: agent, error } = await supabase
      .from("agents")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create agent: " + error.message },
        { status: 500 }
      );
    }

    let txHash: string | undefined;
    if (DEPLOYER_KEY) {
      try {
        const rpcUrl = typeof OG_RPC_URL === "string" ? OG_RPC_URL : "https://evmrpc-testnet.0g.ai";
        const OG_CHAIN = {
          id: 16602,
          name: "0G Testnet",
          nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
          rpcUrls: { default: { http: [rpcUrl] } },
        };
        const account = (await import("viem/accounts")).privateKeyToAccount(
          (DEPLOYER_KEY.trim().startsWith("0x") ? DEPLOYER_KEY.trim() : `0x${DEPLOYER_KEY.trim()}`) as `0x${string}`
        );
        const walletClient = createWalletClient({
          account,
          chain: OG_CHAIN,
          transport: http(rpcUrl),
        });
        const publicClient = createPublicClient({
          chain: OG_CHAIN,
          transport: http(rpcUrl),
        });
        const hash = await walletClient.writeContract({
          address: AGENT_INFT_ADDRESS as `0x${string}`,
          abi: AGENT_INFT_ABI,
          functionName: "mintAgent",
          args: [getAddress(ownerAddress), DEMO_STORAGE_POINTER, DEMO_BLOB_HASH],
        });
        txHash = hash;
        await publicClient.waitForTransactionReceipt({ hash });
      } catch (mintErr) {
        console.error("create-demo: mint (ping contract) failed:", mintErr);
        // agent already created in DB; still return success
      }
    }

    return NextResponse.json(
      {
        message: "Agent created",
        tokenId: nextTokenId,
        agent,
        ...(txHash && { txHash }),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create-demo error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 }
    );
  }
}
