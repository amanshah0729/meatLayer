"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";

const imgBackground = "/image%204.png";
const imgBackgroundOverlay = "/image%204.png";

interface StepState {
  status: "idle" | "loading" | "done";
}

export default function PlaygroundPage() {
  const [agentName, setAgentName] = useState("demo-agent");
  const [apiKey, setApiKey] = useState("");
  const [depositAmount, setDepositAmount] = useState("100");
  const [question, setQuestion] = useState(
    "Is this image a real photo or AI-generated?"
  );
  const [importance, setImportance] = useState("25");
  const [budget, setBudget] = useState("5");

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

  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollTerminal = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollTerminal();
  }, [terminalLines, scrollTerminal]);

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
      const res = await fetch("/api/agents/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          amount: parseFloat(depositAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAgentBalance(data.new_balance);
      updateStep(1, "done");
      typeResponse("POST /api/agents/deposit", data);
    } catch (err) {
      updateStep(1, "idle");
      typeResponse("POST /api/agents/deposit", {
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  async function handleSubmitTask() {
    if (!apiKey) return;
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
          max_budget: parseFloat(budget),
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
              href="/playground"
              className="rounded-[5px] bg-[#e62f5e] px-4 py-[10px] text-white transition-all"
            >
              Agents
            </Link>
          </nav>
          {agentBalance !== null && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-[10px] px-5 py-2.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[13px] text-white/60">{agentDisplayName}</span>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-[14px] text-white font-medium font-mono">
                  {agentBalance} <span className="text-white/40 text-[12px]">MON</span>
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[40px] text-white leading-tight">
            API Playground
          </h1>
          <p className="text-[16px] text-white/50 mt-3 max-w-[500px]">
            Register an agent, fund it, and send your first task in 30 seconds.
          </p>
          <div className="mt-4 bg-white/5 border border-white/10 rounded-[10px] px-5 py-3 inline-block">
            <code className="text-[13px] font-mono text-white/40">
              curl -X POST /api/human-task -d &apos;{`{"api_key":"...","input_payload":{...}}`}&apos;
            </code>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">
          {/* Left: Steps */}
          <div className="w-[42%] flex flex-col gap-4">
            {/* Step 1: Register */}
            <div
              className={`rounded-[16px] p-6 transition-all duration-300 ${
                steps[0].status === "idle"
                  ? "bg-white/5 border border-white/10"
                  : steps[0].status === "loading"
                  ? "bg-white/5 border border-[#e62f5e]/50 shadow-[0_0_30px_rgba(230,47,94,0.15)]"
                  : "bg-white/5 border border-green-500/30"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {stepNumber(1, steps[0])}
                <span className="text-[15px] text-white font-medium">Register Agent</span>
              </div>
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
            </div>

            {/* Step 2: Fund */}
            <div
              className={`rounded-[16px] p-6 transition-all duration-300 ${
                !apiKey
                  ? "bg-white/[0.02] border border-white/5 opacity-50"
                  : steps[1].status === "idle"
                  ? "bg-white/5 border border-white/10"
                  : steps[1].status === "loading"
                  ? "bg-white/5 border border-[#e62f5e]/50 shadow-[0_0_30px_rgba(230,47,94,0.15)]"
                  : "bg-white/5 border border-green-500/30"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {stepNumber(2, steps[1])}
                <span className="text-[15px] text-white font-medium">Fund Agent</span>
                {apiKey && (
                  <span className="ml-auto font-mono text-[11px] text-white/30 truncate max-w-[120px]">
                    {apiKey.slice(0, 8)}...
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount"
                    disabled={!apiKey}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e62f5e]/50 transition-colors disabled:opacity-30"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-white/30">
                    MON
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDeposit}
                  disabled={!apiKey || steps[1].status === "loading"}
                  className="bg-[#e62f5e] rounded-[10px] px-5 py-3 text-[14px] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {steps[1].status === "loading"
                    ? "Depositing..."
                    : `Deposit ${depositAmount} MON`}
                </button>
              </div>
            </div>

            {/* Step 3: Send Task */}
            <div
              className={`rounded-[16px] p-6 transition-all duration-300 ${
                !apiKey
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
                  disabled={!apiKey}
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
                      disabled={!apiKey}
                      min={1}
                      max={100}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e62f5e]/50 transition-colors disabled:opacity-30"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                      importance
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Budget"
                      disabled={!apiKey}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#e62f5e]/50 transition-colors disabled:opacity-30"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-white/30">
                      MON
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitTask}
                  disabled={!apiKey || steps[2].status === "loading"}
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
