import { NextResponse } from "next/server";
import { createPublicClient, http, decodeEventLog } from "viem";
import { baseSepolia } from "viem/chains";
import { GOVERNOR_ABI, GOVERNOR_ABI_BYTES32, NOUNS_PROPOSAL_CREATED_EVENT } from "@/lib/governor-abi";

const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_NOUNS_GOVERNOR_ADDRESS as `0x${string}` | undefined;

const BASE_SEPOLIA_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export async function GET() {
  if (!GOVERNOR_ADDRESS) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_NOUNS_GOVERNOR_ADDRESS not set" },
      { status: 503 }
    );
  }

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });

  try {
    // 1) Bravo-style: proposalCount + proposals(id)
    let count: bigint | null = null;
    try {
      count = await client.readContract({
        address: GOVERNOR_ADDRESS,
        abi: GOVERNOR_ABI,
        functionName: "proposalCount",
      });
    } catch {
      // OZ Governor has no proposalCount
    }

    if (count != null && count > 0n) {
      let latestId = count;
      let proposal: readonly [bigint, string, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
      try {
        proposal = await client.readContract({
          address: GOVERNOR_ADDRESS,
          abi: GOVERNOR_ABI,
          functionName: "proposals",
          args: [latestId],
        });
      } catch {
        latestId = count - 1n;
        proposal = await client.readContract({
          address: GOVERNOR_ADDRESS,
          abi: GOVERNOR_ABI,
          functionName: "proposals",
          args: [latestId],
        });
      }
      const [, proposer, eta, startBlock, endBlock, forVotes, againstVotes, abstainVotes, canceled, executed] = proposal;
      return NextResponse.json({
        proposalId: String(latestId),
        proposer,
        startBlock: String(startBlock),
        endBlock: String(endBlock),
        forVotes: String(forVotes),
        againstVotes: String(againstVotes),
        abstainVotes: String(abstainVotes),
        canceled,
        executed,
        title: `Proposal #${latestId}`,
      });
    }

    // 2) Nouns Builder / OZ-style: get latest proposal from logs (Nouns uses bytes32 proposalId in event data)
    const block = await client.getBlockNumber();
    const fromBlock = block > 10000n ? block - 10000n : 0n;
    const logs = await client.getLogs({
      address: GOVERNOR_ADDRESS,
      fromBlock,
      toBlock: block,
    });

    if (logs.length === 0) {
      return NextResponse.json({
        proposalId: null,
        forVotes: "0",
        againstVotes: "0",
        abstainVotes: "0",
        message: "No proposals yet",
      });
    }

    const latest = logs[logs.length - 1];
    const data = latest.data;
    if (!data || data.length < 66) {
      return NextResponse.json({
        proposalId: null,
        forVotes: "0",
        againstVotes: "0",
        abstainVotes: "0",
        message: "No proposals yet",
      });
    }

    const proposalIdBytes32 = (`0x${data.slice(2, 66)}`) as `0x${string}`;

    let description = "";
    let forVotes = "0";
    let againstVotes = "0";
    let abstainVotes = "0";
    let proposer = "";
    try {
      const decoded = decodeEventLog({
        abi: [NOUNS_PROPOSAL_CREATED_EVENT],
        data: latest.data,
        topics: latest.topics,
      });
      if (decoded.eventName === "ProposalCreated" && decoded.args) {
        description = typeof decoded.args.description === "string" ? decoded.args.description : "";
        proposer = typeof decoded.args.proposal?.proposer === "string" ? decoded.args.proposal.proposer : "";
        const p = decoded.args.proposal as { forVotes?: number; againstVotes?: number; abstainVotes?: number } | undefined;
        if (p) {
          forVotes = String(p.forVotes ?? 0);
          againstVotes = String(p.againstVotes ?? 0);
          abstainVotes = String(p.abstainVotes ?? 0);
        }
      }
    } catch {
      // non-Nouns log or decode failed; keep defaults
    }

    const [snapshot, deadline] = await Promise.all([
      client.readContract({
        address: GOVERNOR_ADDRESS,
        abi: GOVERNOR_ABI_BYTES32,
        functionName: "proposalSnapshot",
        args: [proposalIdBytes32],
      }),
      client.readContract({
        address: GOVERNOR_ADDRESS,
        abi: GOVERNOR_ABI_BYTES32,
        functionName: "proposalDeadline",
        args: [proposalIdBytes32],
      }),
    ]);

    const title = description ? description.split(/\n|&&/)[0].slice(0, 80) : `Proposal ${proposalIdBytes32.slice(0, 14)}…`;

    return NextResponse.json({
      proposalId: proposalIdBytes32,
      proposer,
      startBlock: String(snapshot),
      endBlock: String(deadline),
      forVotes,
      againstVotes,
      abstainVotes,
      title,
      description,
    });
  } catch (err) {
    console.error("Governance latest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read Governor" },
      { status: 500 }
    );
  }
}
