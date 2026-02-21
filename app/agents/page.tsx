"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useSwitchChain, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getAddress, keccak256, toHex, parseEther } from "viem";
import { formatBalance } from "@/lib/frontend-types";

const VAULT_ADDRESS =
  (process.env.NEXT_PUBLIC_VAULT_0G_ADDRESS ||
    "0x62dc022BF3F9aF871e52bDE4A2a6043fdFD4092F") as `0x${string}`;
const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "taskId", type: "bytes32" }],
    outputs: [],
  },
] as const;

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

const fake0g = process.env.NEXT_PUBLIC_FAKE_0G === "true";

export default function MyAgentsPage() {
  const router = useRouter();
  const { address, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState<number | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferTokenId, setTransferTokenId] = useState<number | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Create flow: idle → form → fund → done
  type CreateStep = "idle" | "form" | "fund" | "done";
  const [createStep, setCreateStep] = useState<CreateStep>("idle");
  const [createName, setCreateName] = useState("");
  const [createPersona, setCreatePersona] = useState("autonomous execution agent");
  const [createConfidence, setCreateConfidence] = useState("0.72");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdTokenId, setCreatedTokenId] = useState<number | null>(null);

  const [fundAmount, setFundAmount] = useState("10");
  const [funding, setFunding] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);
  const [createdAgentBalance, setCreatedAgentBalance] = useState<number | null>(null);

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

  async function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setCreating(true);
    setCreateError(null);
    try {
      // Micro tx (1 wei) so wallet confirmation shows; skip if wrong chain
      if (is0G) {
        const microTaskId = keccak256(toHex(`${Date.now()}-${Math.random()}`));
        await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [microTaskId],
          value: 1n,
        });
      }

      const res = await fetch("/api/agents/create-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: address,
          name: createName.trim() || `Agent ${(agents.length + 1)}`,
          persona: createPersona.trim(),
          confidence_threshold: parseFloat(createConfidence) || 0.72,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      const newAgent = data.agent as AgentRow;
      setAgents((prev) => [...prev, newAgent]);
      setCreatedTokenId(data.tokenId);
      setFundError(null);
      setCreatedAgentBalance(null);
      setCreateStep("fund");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  function resetCreateFlow() {
    setCreateStep("idle");
    setCreatedTokenId(null);
    setCreatedAgentBalance(null);
    setCreateName("");
    setCreatePersona("autonomous execution agent");
    setCreateConfidence("0.72");
    setFundAmount("10");
    setCreateError(null);
    setFundError(null);
  }

  async function handleFundAgent(tokenId: number) {
    if (!address) return;
    const amount = parseFloat(fundAmount) || 0;
    if (amount <= 0) return;

    setFunding(true);
    setFundError(null);
    try {
      if (!is0G) {
        setFundError("Switch to 0G Testnet to fund this agent on-chain.");
        return;
      }

      const depositId = keccak256(toHex(`agent-${tokenId}-${address}-${Date.now()}`));
      const txHash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [depositId],
        value: parseEther(fundAmount),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      const res = await fetch("/api/agents/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_id: tokenId,
          wallet_address: address,
          amount,
          tx_hash: txHash,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deposit failed");
      setCreatedAgentBalance(data.new_balance);
      setAgents((prev) =>
        prev.map((a) =>
          a.token_id === tokenId ? { ...a, balance: data.new_balance } : a
        )
      );
      setCreateStep("done");
    } catch (err) {
      setFundError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setFunding(false);
    }
  }

  async function handleTransfer(tokenId: number) {
    if (!address || !transferTo.trim()) return;
    setTransferring(tokenId);
    setTransferError(null);
    try {
      if (fake0g) {
        const toAddr = getAddress(transferTo.trim());
        const res = await fetch("/api/agents/transfer-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token_id: tokenId,
            to_address: toAddr,
            wallet_address: address,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Transfer failed");
        setTransferTokenId(null);
        setTransferTo("");
        setAgents((prev) => prev.filter((a) => a.token_id !== tokenId));
      } else {
        await writeContractAsync({
          address: AGENT_INFT_ADDRESS,
          abi: AGENT_INFT_ABI,
          functionName: "transferFrom",
          args: [getAddress(address), getAddress(transferTo.trim()), BigInt(tokenId)],
        });
        setTransferTokenId(null);
        setTransferTo("");
        setAgents((prev) => prev.filter((a) => a.token_id !== tokenId));
      }
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
            <Link href="/agents" className="rounded-[5px] bg-[#e62f5e] px-4 py-[10px] text-white transition-all">Agents</Link>
          </nav>
          <ConnectButton />
        </header>

        <div className="mb-8">
          <h1 className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[40px] text-white leading-tight">
            Agents
          </h1>
          <p className="text-[16px] text-white/50 mt-3 max-w-[500px]">
            Create agents, then open the Playground to set task budget and send tasks.
          </p>
        </div>

        {address && (
          <div className="mb-8">
            {createStep === "idle" && (
              <button
                type="button"
                onClick={() => setCreateStep("form")}
                className="w-full max-w-xl flex items-center justify-center gap-3 rounded-[16px] border border-white/10 bg-white/5 py-5 px-6 text-[15px] font-medium text-white/90 hover:bg-white/[0.08] hover:border-[#e62f5e]/40 hover:text-white transition-all group"
              >
                <span className="w-9 h-9 rounded-full bg-[#e62f5e]/20 flex items-center justify-center text-[#e62f5e] group-hover:bg-[#e62f5e]/30 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
                <span>Create agent</span>
              </button>
            )}

            {createStep === "form" && (
              <div className="bg-white/5 border border-white/10 rounded-[16px] p-6 max-w-xl">
                <h2 className="text-[15px] font-medium text-white mb-4">New agent</h2>
                <form onSubmit={handleCreateAgent} className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Name</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="my-agent"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Persona</label>
                    <input
                      type="text"
                      value={createPersona}
                      onChange={(e) => setCreatePersona(e.target.value)}
                      placeholder="autonomous execution agent"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Confidence threshold (0–1)</label>
                    <input
                      type="text"
                      value={createConfidence}
                      onChange={(e) => setCreateConfidence(e.target.value)}
                      placeholder="0.72"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e] max-w-[120px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateStep("idle")}
                      className="rounded-[10px] bg-white/10 px-4 py-2.5 text-[14px] text-white/80 hover:bg-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="rounded-[10px] bg-[#e62f5e] px-5 py-2.5 text-[14px] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {creating ? "Creating…" : "Create"}
                    </button>
                  </div>
                </form>
                {createError && <p className="text-red-400 text-sm mt-3">{createError}</p>}
              </div>
            )}

            {createStep === "fund" && createdTokenId != null && (
              <div className="bg-white/5 border border-white/10 rounded-[16px] p-6 max-w-xl">
                <p className="text-green-400/90 text-sm mb-1">Agent #{createdTokenId} created.</p>
                <p className="text-white/50 text-xs mb-4">Fund the agent on-chain (0G Testnet). The transaction will be recorded and the balance updated.</p>
                {!is0G && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400/90 text-sm flex items-center justify-between gap-3">
                    <span>Switch to 0G Testnet to fund on-chain.</span>
                    <button
                      type="button"
                      onClick={() => switchChain?.({ chainId: 16602 })}
                      className="shrink-0 px-3 py-1.5 bg-amber-500/20 rounded-lg text-sm hover:bg-amber-500/30"
                    >
                      Switch to 0G
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Amount (0G)</label>
                    <input
                      type="text"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="10"
                      className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFundAgent(createdTokenId)}
                    disabled={funding || !fundAmount || parseFloat(fundAmount) <= 0 || !is0G}
                    className="rounded-[10px] bg-[#e62f5e] px-5 py-2.5 text-[14px] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {funding ? "Confirm in wallet…" : "Fund on-chain"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateStep("done")}
                    className="rounded-[10px] bg-white/10 px-4 py-2.5 text-[14px] text-white/80 hover:bg-white/15"
                  >
                    Skip
                  </button>
                </div>
                {fundError && <p className="text-red-400 text-sm mt-3">{fundError}</p>}
              </div>
            )}

            {createStep === "done" && createdTokenId != null && (
              <div className="bg-white/5 border border-white/10 rounded-[16px] p-6 max-w-xl">
                <p className="text-green-400/90 text-sm mb-3">
                  {createdAgentBalance != null
                    ? `Agent #{createdTokenId} funded with ${formatBalance(createdAgentBalance)} 0G.`
                    : `Agent #{createdTokenId} created. Set task budget in the Playground.`}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/playground?token_id=${createdTokenId}`}
                    className="rounded-[10px] bg-[#e62f5e] px-5 py-2.5 text-[14px] text-white hover:opacity-90 transition-opacity"
                  >
                    Open in Playground →
                  </Link>
                  <button
                    type="button"
                    onClick={resetCreateFlow}
                    className="rounded-[10px] bg-white/10 px-4 py-2.5 text-[14px] text-white/80 hover:bg-white/15"
                  >
                    Create another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!address && (
          <div className="bg-white/5 border border-white/10 rounded-[16px] p-8 text-center">
            <p className="text-white/60">Connect your wallet to see your agents.</p>
          </div>
        )}

        {address && !fake0g && !is0G && (
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

        {address && !loading && agents.length === 0 && !createdTokenId && (
          <div className="bg-white/5 border border-white/10 rounded-[16px] p-12 text-center">
            <p className="text-white/60">Create your first agent using the form above.</p>
          </div>
        )}

        {address && !loading && agents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[13px] font-medium text-white/60 uppercase tracking-wider">Your agents</h2>
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => router.push(`/playground?token_id=${agent.token_id}`)}
                className="bg-white/5 border border-white/10 rounded-[16px] p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.07] hover:border-white/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e62f5e]/20 flex items-center justify-center text-[#e62f5e] font-semibold text-[14px]">
                    #
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-white">{agent.name}</span>
                      <span className="text-[11px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                        #{agent.token_id}
                      </span>
                    </div>
                    <p className="text-[13px] text-white/50 mt-0.5">
                      {formatBalance(agent.balance)} 0G balance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[13px] text-white/40 group-hover:text-[#e62f5e] transition-colors">
                    Open Playground →
                  </span>
                  <button
                    type="button"
                    onClick={() => setTransferTokenId(agent.token_id)}
                    disabled={!fake0g && !is0G}
                    className="rounded-[10px] bg-white/10 px-4 py-2 text-[13px] text-white/80 hover:bg-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
