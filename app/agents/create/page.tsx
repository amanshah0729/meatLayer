"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  createDefaultConfig,
  generateKeyAndIv,
  encryptConfig,
  type AgentConfig,
} from "@/lib/agent-encryption";

const imgBackground = "/image%204.png";
const imgBackgroundOverlay = "/image%204.png";

export default function CreateAgentPage() {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const [name, setName] = useState("my-agent");
  const [persona, setPersona] = useState("autonomous execution agent");
  const [confidence, setConfidence] = useState("0.72");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{
    tokenId?: number;
    agent?: unknown;
    txHash?: string;
    error?: string;
  }>({});
  const [encryptionKeyHex, setEncryptionKeyHex] = useState<string | null>(null);

  const is0G = chain?.id === 16602;

  async function handleCreate() {
    if (!address) return;

    setStatus("loading");
    setResult({});

    try {
      const config: AgentConfig = createDefaultConfig({
        persona,
        confidence_threshold: parseFloat(confidence) || 0.72,
      });

      const { key } = await generateKeyAndIv();
      const { encryptedBlobBase64 } = await encryptConfig(config, key);

      setEncryptionKeyHex(
        Array.from(key)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );

      const res = await fetch("/api/agents/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: address,
          encryptedBlobBase64,
          name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mint failed");

      setResult({
        tokenId: data.tokenId,
        agent: data.agent,
        txHash: data.txHash,
      });
      setStatus("done");
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Mint failed",
      });
      setStatus("error");
    }
  }

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
              className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all"
            >
              Agents
            </Link>
            <Link
              href="/agents/create"
              className="rounded-[5px] bg-[#e62f5e] px-4 py-[10px] text-white transition-all"
            >
              Create iNFT
            </Link>
          </nav>
          <ConnectButton />
        </header>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[40px] text-white leading-tight">
            Create Agent iNFT
          </h1>
          <p className="text-[16px] text-white/50 mt-3 max-w-[600px]">
            Create an AI agent as an iNFT on 0G. Config is encrypted and stored in 0G Storage.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-xl space-y-6">
          <div>
            <label className="block text-sm text-white/70 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e] focus:border-transparent"
              placeholder="my-agent"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Persona</label>
            <input
              type="text"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e] focus:border-transparent"
              placeholder="autonomous execution agent"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">
              Confidence threshold (0–1)
            </label>
            <input
              type="text"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#e62f5e] focus:border-transparent"
              placeholder="0.72"
            />
            <p className="text-xs text-white/40 mt-1">Lower = more human fallbacks</p>
          </div>

          {!address ? (
            <p className="text-white/60 text-sm py-2">Connect your wallet to create an agent.</p>
          ) : !is0G ? (
            <div className="space-y-2 py-2">
              <p className="text-amber-400/90 text-sm">
                Switch to 0G Testnet to create agent (optional; mint works from any chain).
              </p>
              <button
                type="button"
                onClick={() => switchChain?.({ chainId: 16602 })}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
              >
                Switch to 0G Testnet
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleCreate}
            disabled={!address || status === "loading"}
            className="w-full bg-[#e62f5e] hover:bg-[#e62f5e]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all"
          >
            {status === "loading" ? "Encrypting & minting..." : "Create Agent iNFT"}
          </button>

          {status === "done" && result.tokenId !== undefined && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
              <p className="text-green-400 font-medium">Agent minted!</p>
              <p className="text-sm text-white/70">
                Token ID: <span className="font-mono">{result.tokenId}</span>
              </p>
              {result.txHash && (
                <p className="text-sm text-white/70 break-all">Tx: {result.txHash}</p>
              )}
              {encryptionKeyHex && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-amber-400/90 text-xs mb-1">
                    Save your encryption key (needed to decrypt config):
                  </p>
                  <code className="text-xs font-mono text-white/60 break-all block">
                    {encryptionKeyHex}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      const key = `agent_key_${result.tokenId}`;
                      if (typeof localStorage !== "undefined") {
                        localStorage.setItem(key, encryptionKeyHex);
                      }
                    }}
                    className="mt-2 text-xs text-[#e62f5e] hover:underline"
                  >
                    Store key locally
                  </button>
                </div>
              )}
            </div>
          )}

          {status === "error" && result.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">{result.error}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
