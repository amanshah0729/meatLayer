"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useSearchParams } from "next/navigation";
import { parseEther, keccak256, toHex } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const imgBackground = "/image%204.png";
const imgBackgroundOverlay = "/image%204.png";

const VAULT_ADDRESS =
  (process.env.NEXT_PUBLIC_VAULT_0G_ADDRESS ||
    "0x62dc022BF3F9aF871e52bDE4A2a6043fdFD4092F") as const;
const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "taskId", type: "bytes32" }],
    outputs: [],
  },
] as const;

interface StepState {
  status: "idle" | "loading" | "done";
}

interface AgentRow {
  id: number;
  name: string;
  token_id: number | null;
  balance: number;
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [mode, setMode] = useState<"legacy" | "inft">("legacy");
  const [myAgents, setMyAgents] = useState<AgentRow[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  const [agentName, setAgentName] = useState("demo-agent");
  const [apiKey, setApiKey] = useState("");
  const [taskLimit, setTaskLimit] = useState("5");
  const [question, setQuestion] = useState(
    "Is this image a real photo or AI-generated?"
  );
  const [importance, setImportance] = useState("25");

  const [steps, setSteps] = useState<[StepState, StepState, StepState]>([
    { status: "idle" },
    { status: "idle" },
    { status: "idle" },
  ]);

  const [terminalLines, setTerminalLines] = useState<string[]>([
    '// Welcome to MeatLayer API Playground',
    '// Register an agent, fund it, and send your first task.',
    '',
    '$ _',
  ]);
  const [terminalEndpoint, setTerminalEndpoint] = useState("");
  const [copied, setCopied] = useState(false);
  const [agentBalance, setAgentBalance] = useState<number | null>(null);
  const [agentDisplayName, setAgentDisplayName] = useState("");
  const [lastTxHash, setLastTxHash] = useState("");
  const [agentSpecs, setAgentSpecs] = useState<{
    specs: { confidence_threshold: number; persona: string; [k: string]: unknown };
    humans_worked_with: string[];
  } | null>(null);
  const [agentSpecsLoading, setAgentSpecsLoading] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollTerminal = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollTerminal();
  }, [terminalLines, scrollTerminal]);

  useEffect(() => {
    const tid = searchParams.get("token_id");
    if (tid) {
      const n = parseInt(tid, 10);
      if (!isNaN(n)) {
        setMode("inft");
        setSelectedTokenId(n);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!address || mode !== "inft") return;
    fetch(`/api/agents/mine?wallet_address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMyAgents(list);
        if (list.length > 0 && !selectedTokenId) setSelectedTokenId(list[0].token_id ?? null);
      })
      .catch(() => setMyAgents([]));
  }, [address, mode]);

  useEffect(() => {
    if (mode === "inft" && selectedTokenId) {
      const agent = myAgents.find((a) => a.token_id === selectedTokenId);
      if (agent) {
        setAgentDisplayName(agent.name);
        setAgentBalance(agent.balance ?? 0);
      }
    }
  }, [mode, selectedTokenId, myAgents]);

  useEffect(() => {
    if (mode !== "inft" || selectedTokenId == null) {
      setAgentSpecs(null);
      return;
    }
    setAgentSpecsLoading(true);
    setAgentSpecs(null);
    fetch(`/api/agents/${selectedTokenId}/specs`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.specs != null && Array.isArray(data.humans_worked_with)) {
          setAgentSpecs({
            specs: data.specs,
            humans_worked_with: data.humans_worked_with,
          });
        }
      })
      .catch(() => setAgentSpecs(null))
      .finally(() => setAgentSpecsLoading(false));
  }, [mode, selectedTokenId]);

  useEffect(() => {
    if (mode === "legacy" && apiKey) {
      fetch(`/api/agents/balance?api_key=${encodeURIComponent(apiKey)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && typeof data.balance === "number") setAgentBalance(data.balance);
        })
        .catch(() => {});
    }
  }, [mode, apiKey]);

  function updateStep(index: number, status: StepState["status"]) {
    setSteps((prev) => {
      const next = [...prev] as [StepState, StepState, StepState];
      next[index] = { status };
      return next;
    });
  }

  function typeResponse(endpoint: string, json: unknown) {
    setTerminalEndpoint(endpoint);
    const formatted = JSON.stringify(json, null, 2);
    const lines = formatted.split("\n");
    const allLines = ["$ curl -X POST " + endpoint, "", ...lines, "", "$ _"];

    setTerminalLines([allLines[0]]);

    let i = 1;
    const interval = setInterval(() => {
      if (i < allLines.length) {
        const lineToAdd = allLines[i];
        setTerminalLines((prev) => [...prev, lineToAdd]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
  }

  async function handleRegister() {
    updateStep(0, "loading");
    try {
      const res = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApiKey(data.agent.api_key);
      setAgentDisplayName(data.agent.name);
      setAgentBalance(data.agent.balance || 0);
      updateStep(0, "done");
      typeResponse("POST /api/agents/register", data);
    } catch (err) {
      updateStep(0, "idle");
      typeResponse("POST /api/agents/register", {
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  async function handleDeposit() {
    if (!apiKey) return;
    updateStep(1, "loading");
    try {
      const depositId = keccak256(
        toHex(`${apiKey}-${Date.now()}-${Math.random()}`)
      );

      setTerminalLines([
        "$ vault.deposit()",
        "",
        `// sending ${depositAmount} 0G to vault (0G Testnet)...`,
        `// from: ${address ?? "connected wallet"}`,
        `// vault: ${VAULT_ADDRESS}`,
        "",
        "$ _",
      ]);
      setTerminalEndpoint("vault.deposit()");

      const txHash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [depositId],
        value: parseEther(depositAmount),
      });

      setLastTxHash(txHash);
      setTerminalLines((prev) => [
        ...prev.slice(0, -1),
        `// tx submitted: ${txHash.slice(0, 18)}...`,
        "// waiting for confirmation...",
        "",
        "$ _",
      ]);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      const res = await fetch("/api/agents/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          amount: parseFloat(depositAmount),
          tx_hash: txHash,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAgentBalance(data.new_balance);
      updateStep(1, "done");
      typeResponse("POST /api/agents/deposit", {
        ...data,
        tx_hash: txHash,
        on_chain: true,
        vault: VAULT_ADDRESS,
      });
    } catch (err) {
      updateStep(1, "idle");
      typeResponse("vault.deposit() FAILED", {
        error: err instanceof Error ? err.message : "Transaction failed or rejected",
      });
    }
  }

  async function handleSubmitTask() {
    if (mode === "inft") {
      if (!address || selectedTokenId == null) return;
      updateStep(2, "loading");
      try {
        const limit = parseFloat(taskLimit);
        if (agentBalance != null && (Number.isNaN(limit) || limit <= 0 || limit > agentBalance)) {
          typeResponse("POST /api/human-task", {
            error: `Task limit must be between 0 and agent balance (${agentBalance} 0G)`,
          });
          return;
        }
        const body = {
          token_id: selectedTokenId,
          wallet_address: address,
          input_payload: { question, task_type: "Verification", ai_confidence: 42 },
          importance_level: parseInt(importance),
          max_budget: Number.isNaN(limit) || limit <= 0 ? (agentBalance ?? 5) : limit,
        };
        const res = await fetch("/api/human-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.agent_balance_remaining !== undefined) {
          setAgentBalance(data.agent_balance_remaining);
        }
        updateStep(2, "done");
        typeResponse("POST /api/human-task (iNFT)", data);
      } catch (err) {
        updateStep(2, "idle");
        typeResponse("POST /api/human-task", {
          error: err instanceof Error ? err.message : "Failed",
        });
      }
      return;
    }
    if (!apiKey) return;
    const limit = parseFloat(taskLimit);
    if (agentBalance != null && (Number.isNaN(limit) || limit <= 0 || limit > agentBalance)) {
      typeResponse("POST /api/human-task", {
        error: `Task limit must be between 0 and agent balance (${agentBalance} 0G)`,
      });
      return;
    }
    updateStep(2, "loading");
    try {
      const res = await fetch("/api/human-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          input_payload: {
            question,
            task_type: "Verification",
            ai_confidence: 42,
          },
          importance_level: parseInt(importance),
          max_budget: Number.isNaN(limit) || limit <= 0 ? (agentBalance ?? 5) : limit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.agent_balance_remaining !== undefined) {
        setAgentBalance(data.agent_balance_remaining);
      }
      updateStep(2, "done");
      typeResponse("POST /api/human-task", data);
    } catch (err) {
      updateStep(2, "idle");
      typeResponse("POST /api/human-task", {
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  function handleSetTaskLimit() {
    const limit = parseFloat(taskLimit);
    if (Number.isNaN(limit) || limit <= 0) {
      typeResponse("Set task limit", { error: "Enter a valid limit (0G) greater than 0" });
      return;
    }
    if (agentBalance != null && limit > agentBalance) {
      typeResponse("Set task limit", {
        error: `Task limit (${limit} 0G) cannot exceed agent balance (${agentBalance} 0G)`,
      });
      return;
    }
    updateStep(1, "done");
    setTerminalLines((prev) => [
      ...prev,
      "",
      `// Task limit set: ${limit} 0G for this task`,
      "$ _",
    ]);
  }

  function copyApiKey() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stepNumber = (n: number, state: StepState) => (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0 transition-all duration-300 ${
        state.status === "done"
          ? "bg-green-500 text-white"
          : state.status === "loading"
          ? "bg-[#e62f5e] text-white animate-pulse"
          : "bg-white/10 text-white/50"
      }`}
    >
      {state.status === "done" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        n
      )}
    </div>
  );

  return (
    <main className="min-h-screen w-full bg-[#0d0d0f] text-white relative">
      {/* Background */}
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
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <nav className="flex items-center gap-4 font-normal text-[13px]">
            <Link href="/" className="text-white hover:text-white/90 mr-6">
              MeatLayer
            </Link>
            <Link
              href="/dashboard"
              className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all"
            >
              Workers
            </Link>
            <Link
              href="/agents"
              className="rounded-[5px] bg-[#e62f5e] px-4 py-[10px] text-white transition-all"
            >
              Agents
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {agentBalance !== null && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-[10px] px-5 py-2.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[13px] text-white/60">{agentDisplayName}</span>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-[14px] text-white font-medium font-mono">
                  {agentBalance} <span className="text-white/40 text-[12px]">0G</span>
                </span>
              </div>
            )}
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
                const connected = mounted && account && chain;
                return (
                  <div
                    {...(!mounted && {
                      "aria-hidden": true,
                      style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                    })}
                  >
                    {!connected ? (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="bg-[#e62f5e] rounded-[10px] px-5 py-2.5 text-[13px] text-white hover:opacity-90 transition-opacity"
                      >
                        Connect Wallet
                      </button>
                    ) : chain.unsupported ? (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="bg-red-500 rounded-[10px] px-5 py-2.5 text-[13px] text-white hover:opacity-90 transition-opacity"
                      >
                        Wrong Network
                      </button>
                    ) : (
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-[13px] text-white hover:bg-white/10 transition-all"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-mono">
                          {account.displayName}
                        </span>
                        {account.displayBalance && (
                          <>
                            <div className="w-px h-4 bg-white/10" />
                            <span className="text-white/60">{account.displayBalance}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-[13px] text-white/50">
          <Link href="/agents" className="text-white/60 hover:text-white transition-colors">
            Agents
          </Link>
          {selectedTokenId && (
            <>
              <span>/</span>
              <span className="text-white/70">Agent #{selectedTokenId}</span>
            </>
          )}
          <span>/</span>
          <span className="text-white/50">API Playground</span>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[40px] text-white leading-tight">
            API Playground
          </h1>
          <p className="text-[16px] text-white/50 mt-3 max-w-[500px]">
            {mode === "legacy"
              ? "Register an agent, fund it, and send your first task."
              : "Use your iNFT agent to fund and send tasks (auth via signature)."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("legacy")}
              className={`rounded-[10px] px-4 py-2 text-[13px] transition-all ${
                mode === "legacy" ? "bg-[#e62f5e] text-white" : "bg-white/10 text-white/60 hover:text-white"
              }`}
            >
              Legacy (api_key)
            </button>
            <button
              type="button"
              onClick={() => setMode("inft")}
              className={`rounded-[10px] px-4 py-2 text-[13px] transition-all ${
                mode === "inft" ? "bg-[#e62f5e] text-white" : "bg-white/10 text-white/60 hover:text-white"
              }`}
            >
              iNFT (token_id + sign)
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">
          {/* Left: Steps */}
          <div className="w-[42%] flex flex-col gap-4">
            {/* Step 1: Register (legacy) or Select Agent (iNFT) */}
            <div
              className={`rounded-[16px] p-6 transition-all duration-300 ${
                mode === "inft"
                  ? selectedTokenId
                    ? steps[0].status === "done"
                      ? "bg-white/5 border border-green-500/30"
                      : "bg-white/5 border border-white/10"
                    : "bg-white/5 border border-white/10"
                  : steps[0].status === "idle"
                  ? "bg-white/5 border border-white/10"
                  : steps[0].status === "loading"
                  ? "bg-white/5 border border-[#e62f5e]/50 shadow-[0_0_30px_rgba(230,47,94,0.15)]"
                  : "bg-white/5 border border-green-500/30"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {stepNumber(1, mode === "inft" ? (selectedTokenId ? { status: "done" as const } : steps[0]) : steps[0])}
                <span className="text-[15px] text-white font-medium">
                  {mode === "inft" ? "Select iNFT Agent" : "Register Agent"}
                </span>
              </div>
              {mode === "inft" ? (
                <div>
                  <select
                    value={selectedTokenId ?? ""}
                    onChange={(e) => setSelectedTokenId(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#e62f5e]/50"
                  >
                    <option value="">Choose an agent...</option>
                    {myAgents.map((a) => (
                      <option key={a.id} value={a.token_id ?? ""}>
                        {a.name} #{a.token_id} ({a.balance ?? 0} 0G)
                      </option>
                    ))}
                  </select>
                  {myAgents.length === 0 && address && (
                    <p className="text-[12px] text-white/50 mt-2">
                      No agents yet. <Link href="/agents" className="text-[#e62f5e] hover:underline">Create one</Link>
                    </p>
                  )}
                  {selectedTokenId && (
                    <p className="text-[11px] text-green-400/80 mt-2">Agent #{selectedTokenId} selected</p>
                  )}
                  {selectedTokenId && (
                    <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
                      <p className="text-[11px] text-white/40 uppercase tracking-wider">Agent specs</p>
                      {agentSpecsLoading ? (
                        <p className="text-[12px] text-white/50">Loading…</p>
                      ) : agentSpecs ? (
                        <>
                          <dl className="space-y-2 text-[13px]">
                            <div>
                              <dt className="text-white/50">Confidence threshold</dt>
                              <dd className="text-white font-mono">
                                {(Number(agentSpecs.specs.confidence_threshold) * 100).toFixed(0)}%
                              </dd>
                            </div>
                            <div>
                              <dt className="text-white/50">Persona</dt>
                              <dd className="text-white">{String(agentSpecs.specs.persona || "—")}</dd>
                            </div>
                          </dl>
                          <div>
                            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">
                              Humans worked with ({agentSpecs.humans_worked_with.length})
                            </p>
                            {agentSpecs.humans_worked_with.length === 0 ? (
                              <p className="text-[12px] text-white/50">No tasks completed by workers yet.</p>
                            ) : (
                              <ul className="space-y-1 max-h-32 overflow-y-auto">
                                {agentSpecs.humans_worked_with.map((addr) => (
                                  <li
                                    key={addr}
                                    className="font-mono text-[11px] text-white/70 truncate"
                                    title={addr}
                                  >
                                    {addr}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-[12px] text-white/50">No specs or no data.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Agent name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e62f5e]/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={steps[0].status === "loading" || !agentName.trim()}
                      className="bg-[#e62f5e] rounded-[10px] px-5 py-3 text-[14px] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {steps[0].status === "loading" ? "Creating..." : "Create Agent"}
                    </button>
                  </div>
                  {apiKey && (
                    <div className="mt-4">
                      <p className="text-[11px] text-white/40 mb-2 uppercase tracking-wider">API Key</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 font-mono text-[13px] text-green-400 truncate">
                          {apiKey}
                        </div>
                        <button
                          type="button"
                          onClick={copyApiKey}
                          className="bg-white/10 rounded-lg px-3 py-2.5 text-[12px] text-white/60 hover:text-white hover:bg-white/15 transition-all"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-400/70 mt-2">Save this key -- it won&apos;t be shown again.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step 2: Set task limit (max 0G for this task; must be ≤ agent balance) */}
            <div
              className={`rounded-[16px] p-6 transition-all duration-300 ${
                (mode === "legacy" ? !apiKey : !selectedTokenId)
                  ? "bg-white/[0.02] border border-white/5 opacity-50"
                  : steps[1].status === "idle"
                  ? "bg-white/5 border border-white/10"
                  : steps[1].status === "done"
                  ? "bg-white/5 border border-green-500/30"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {stepNumber(2, steps[1])}
                <span className="text-[15px] text-white font-medium">Set task limit</span>
                {mode === "legacy" && apiKey && (
                  <span className="ml-auto font-mono text-[11px] text-white/30 truncate max-w-[120px]">
                    {apiKey.slice(0, 8)}...
                  </span>
                )}
                {mode === "inft" && selectedTokenId && (
                  <span className="ml-auto font-mono text-[11px] text-white/30">#{selectedTokenId}</span>
                )}
              </div>
              <p className="text-[12px] text-white/50 mb-3">
                Agent balance: {agentBalance != null ? `${agentBalance} 0G` : "—"}
              </p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={taskLimit}
                    onChange={(e) => setTaskLimit(e.target.value)}
                    placeholder="Max 0G for this task"
                    disabled={mode === "legacy" ? !apiKey : !selectedTokenId}
                    min={0}
                    step="any"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e62f5e]/50 transition-colors disabled:opacity-30"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-white/30">
                    0G
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSetTaskLimit}
                  disabled={
                    (mode === "legacy" ? !apiKey : !selectedTokenId) ||
                    (agentBalance != null && (parseFloat(taskLimit) > agentBalance || parseFloat(taskLimit) <= 0))
                  }
                  className="bg-[#e62f5e] rounded-[10px] px-5 py-3 text-[14px] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Set task limit
                </button>
              </div>
              {agentBalance != null && parseFloat(taskLimit) > agentBalance && (
                <p className="text-[11px] text-amber-400 mt-2">
                  Limit cannot exceed agent balance ({agentBalance} 0G).
                </p>
              )}
            </div>

            {/* Step 3: Send Task */}
            <div
              className={`rounded-[16px] p-6 transition-all duration-300 ${
                (mode === "legacy" ? !apiKey : !selectedTokenId)
                  ? "bg-white/[0.02] border border-white/5 opacity-50"
                  : steps[2].status === "idle"
                  ? "bg-white/5 border border-white/10"
                  : steps[2].status === "loading"
                  ? "bg-white/5 border border-[#e62f5e]/50 shadow-[0_0_30px_rgba(230,47,94,0.15)]"
                  : "bg-white/5 border border-green-500/30"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {stepNumber(3, steps[2])}
                <span className="text-[15px] text-white font-medium">Send Task</span>
              </div>
              <div className="flex flex-col gap-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What do you need humans to decide?"
                  disabled={mode === "legacy" ? !apiKey : !selectedTokenId}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e62f5e]/50 transition-colors resize-none disabled:opacity-30"
                />
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={importance}
                      onChange={(e) => setImportance(e.target.value)}
                      placeholder="1-100"
                      disabled={mode === "legacy" ? !apiKey : !selectedTokenId}
                      min={1}
                      max={100}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e62f5e]/50 transition-colors disabled:opacity-30"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                      importance
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitTask}
                  disabled={(mode === "legacy" ? !apiKey : !selectedTokenId) || steps[2].status === "loading"}
                  className="bg-[#e62f5e] rounded-[10px] px-5 py-3 text-[14px] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {steps[2].status === "loading"
                    ? "Submitting..."
                    : "Submit to Humans"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="flex-1 sticky top-[120px]">
            <div className="bg-[#0a0a0c] rounded-[16px] border border-white/10 overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[12px] font-mono text-white/30">
                  {terminalEndpoint || "meatlayer-api"}
                </span>
              </div>
              {/* Terminal body */}
              <div
                ref={terminalRef}
                className="p-5 font-mono text-[13px] leading-relaxed h-[520px] overflow-y-auto"
              >
                {terminalLines.map((line, i) => {
                  if (!line) return <div key={i} className="h-[1.5em]" />;
                  if (line.startsWith("$")) {
                    return (
                      <div key={i} className="text-white/50">
                        <span className="text-[#e62f5e]">$ </span>
                        <span>{line.slice(2)}</span>
                      </div>
                    );
                  }
                  if (line.startsWith("//")) {
                    return (
                      <div key={i} className="text-white/20">
                        {line}
                      </div>
                    );
                  }
                  // JSON syntax highlighting
                  const highlighted = line
                    .replace(
                      /"([^"]+)":/g,
                      '<span class="text-[#e62f5e]">"$1"</span>:'
                    )
                    .replace(
                      /: "([^"]+)"/g,
                      ': <span class="text-green-400">"$1"</span>'
                    )
                    .replace(
                      /: (\d+\.?\d*)/g,
                      ': <span class="text-amber-400">$1</span>'
                    )
                    .replace(
                      /: (true|false|null)/g,
                      ': <span class="text-purple-400">$1</span>'
                    );

                  return (
                    <div
                      key={i}
                      className="text-white/70"
                      dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-[#e62f5e] border-t-transparent rounded-full" /></div>}>
      <PlaygroundContent />
    </Suspense>
  );
}
