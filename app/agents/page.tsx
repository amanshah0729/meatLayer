"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getAddress } from "viem";

const imgBackground = "/image%204.png";
const imgBackgroundOverlay = "/image%204.png";

const AGENT_INFT_ADDRESS =
  (process.env.NEXT_PUBLIC_AGENT_INFT_CONTRACT_ADDRESS ||
    "0x3C29D937B1B9D6DaBaC8CE733595F1cBB0E0b3DF") as `0x${string}`;

const AGENT_INFT_ABI = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface AgentRow {
  id: number;
  name: string;
  token_id: number | null;
  owner_address: string | null;
  balance: number;
  storage_pointer: string | null;
  created_at: string;
}

export default function MyAgentsPage() {
  const { address, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChain } = useSwitchChain();

  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState<number | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferTokenId, setTransferTokenId] = useState<number | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  const is0G = chain?.id === 16602;

  useEffect(() => {
    if (!address) {
      setAgents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/agents/mine?wallet_address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        setAgents(Array.isArray(data) ? data : []);
      })
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, [address]);

  async function handleTransfer(tokenId: number) {
    if (!address || !transferTo.trim()) return;
    setTransferring(tokenId);
    setTransferError(null);
    try {
      await writeContractAsync({
        address: AGENT_INFT_ADDRESS,
        abi: AGENT_INFT_ABI,
        functionName: "transferFrom",
        args: [getAddress(address), getAddress(transferTo.trim()), BigInt(tokenId)],
      });
      setTransferTokenId(null);
      setTransferTo("");
      setAgents((prev) => prev.filter((a) => a.token_id !== tokenId));
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferring(null);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#0d0d0f] text-white relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] via-[#12121a] to-[#0d0d0f]" />
      <div className="absolute inset-0">
        <div className="absolute -translate-x-1/2 left-1/2 -top-12 h-[1198px] w-[2138px] opacity-90">
          <img alt="" className="absolute inset-0 max-w-none object-cover w-full h-full" src={imgBackground} />
        </div>
        <div className="absolute -left-40 -top-4 h-[1155px] w-[2061px] opacity-80">
          <img alt="" className="absolute inset-0 max-w-none object-cover w-full h-full" src={imgBackgroundOverlay} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/20" />
        </div>
      </div>

      <div className="relative z-10 pl-[130px] pr-[130px] pt-[42px] pb-8">
        <header className="flex items-center justify-between mb-10">
          <nav className="flex items-center gap-4 font-normal text-[13px]">
            <Link href="/" className="text-white hover:text-white/90 mr-6">MeatLayer</Link>
            <Link href="/dashboard" className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all">Workers</Link>
            <Link href="/playground" className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all">Playground</Link>
            <Link href="/agents" className="rounded-[5px] bg-[#e62f5e] px-4 py-[10px] text-white transition-all">My Agents</Link>
            <Link href="/agents/create" className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all">Create iNFT</Link>
          </nav>
          <ConnectButton />
        </header>

        <div className="mb-10">
          <h1 className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[40px] text-white leading-tight">
            My Agents
          </h1>
          <p className="text-[16px] text-white/50 mt-3 max-w-[500px]">
            iNFT agents you own. Use them in the Playground or transfer to another wallet.
          </p>
        </div>

        {!address && (
          <div className="bg-white/5 border border-white/10 rounded-[16px] p-8 text-center">
            <p className="text-white/60">Connect your wallet to see your agents.</p>
          </div>
        )}

        {address && !is0G && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-[10px] px-4 py-3 flex items-center justify-between">
            <p className="text-amber-400/90 text-sm">Switch to 0G Testnet to transfer agents.</p>
            <button
              type="button"
              onClick={() => switchChain?.({ chainId: 16602 })}
              className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30"
            >
              Switch to 0G
            </button>
          </div>
        )}

        {address && loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-[#e62f5e] border-t-transparent rounded-full" />
          </div>
        )}

        {address && !loading && agents.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-[16px] p-12 text-center">
            <p className="text-white/60 mb-4">No iNFT agents yet.</p>
            <Link
              href="/agents/create"
              className="inline-block bg-[#e62f5e] hover:bg-[#e62f5e]/90 text-white font-medium px-6 py-3 rounded-lg transition-all"
            >
              Create your first agent
            </Link>
          </div>
        )}

        {address && !loading && agents.length > 0 && (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white/5 border border-white/10 rounded-[16px] p-6 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-medium text-white">{agent.name}</span>
                    <span className="text-[11px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                      #{agent.token_id}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/50 mt-1">
                    {agent.balance ?? 0} MON balance
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/playground?token_id=${agent.token_id}`}
                    className="rounded-[10px] bg-[#e62f5e] px-5 py-2.5 text-[14px] text-white hover:opacity-90 transition-opacity"
                  >
                    Use in Playground
                  </Link>
                  <button
                    type="button"
                    onClick={() => setTransferTokenId(agent.token_id)}
                    disabled={!is0G}
                    className="rounded-[10px] bg-white/10 px-5 py-2.5 text-[14px] text-white/80 hover:bg-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {transferTokenId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] border border-white/10 rounded-[16px] p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-white mb-4">Transfer Agent #{transferTokenId}</h3>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Recipient address (0x...)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e] mb-4"
              />
              {transferError && <p className="text-red-400 text-sm mb-4">{transferError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setTransferTokenId(null); setTransferTo(""); setTransferError(null); }}
                  className="flex-1 rounded-[10px] bg-white/10 px-4 py-3 text-[14px] text-white/80 hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleTransfer(transferTokenId)}
                  disabled={!transferTo.trim() || transferring !== null}
                  className="flex-1 rounded-[10px] bg-[#e62f5e] px-4 py-3 text-[14px] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {transferring !== null ? "Transferring..." : "Transfer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
