import { NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  getAddress,
  decodeEventLog,
} from "viem";
import { supabase } from "@/lib/supabase";
import { AGENT_INFT_ADDRESS, OG_RPC_URL } from "@/lib/contracts";
import { uploadTo0G } from "@/lib/og-storage";
import { computeBlobHash } from "@/lib/agent-blob-hash";

const rpcUrl =
  typeof OG_RPC_URL === "string" ? OG_RPC_URL : "https://evmrpc-testnet.0g.ai";

const OG_CHAIN = {
  id: 16602,
  name: "0G Testnet",
  nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
  rpcUrls: { default: { http: [rpcUrl] } },
} as const;

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
  {
    type: "event",
    name: "AgentMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "storagePointer", type: "string", indexed: false },
    ],
  },
] as const;

const DEPLOYER_KEY =
  process.env.DEPLOYER_PRIVATE_KEY || process.env.MONAD_PRIVATE_KEY;

export async function POST(request: Request) {
  const body = await request.json();
  const { ownerAddress, encryptedBlobBase64, name } = body;

  if (!ownerAddress || !encryptedBlobBase64) {
    return NextResponse.json(
      { error: "ownerAddress and encryptedBlobBase64 are required" },
      { status: 400 }
    );
  }

  if (!DEPLOYER_KEY) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured: DEPLOYER_PRIVATE_KEY or MONAD_PRIVATE_KEY not set",
      },
      { status: 500 }
    );
  }

  try {
    const blobHash = computeBlobHash(encryptedBlobBase64);
    const { rootHash } = await uploadTo0G(encryptedBlobBase64, DEPLOYER_KEY);

    const account = await import("viem/accounts").then((m) =>
      m.privateKeyToAccount(
        DEPLOYER_KEY.trim().startsWith("0x")
          ? (DEPLOYER_KEY.trim() as `0x${string}`)
          : (`0x${DEPLOYER_KEY.trim()}` as `0x${string}`)
      )
    );

    const client = createWalletClient({
      account,
      chain: OG_CHAIN,
      transport: http(rpcUrl),
    });

    const hash = await client.writeContract({
      address: AGENT_INFT_ADDRESS as `0x${string}`,
      abi: AGENT_INFT_ABI,
      functionName: "mintAgent",
      args: [getAddress(ownerAddress), rootHash, blobHash],
    });

    const publicClient = createPublicClient({
      chain: OG_CHAIN,
      transport: http(rpcUrl),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    let tokenId = 1;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: AGENT_INFT_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "AgentMinted") {
          tokenId = Number((decoded.args as { tokenId: bigint }).tokenId);
          break;
        }
      } catch {
        continue;
      }
    }

    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        name: name || `Agent #${tokenId}`,
        api_key: crypto.randomUUID(),
        balance: 0,
        token_id: tokenId,
        owner_address: ownerAddress,
        storage_pointer: rootHash,
        blob_hash: blobHash,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create agent record: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Agent iNFT minted",
        tokenId,
        agent,
        txHash: hash,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Mint error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Mint failed",
      },
      { status: 500 }
    );
  }
}
