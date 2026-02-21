"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function SignupPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    if (!address || !username.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          username: username.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Already registered, just go to dashboard
          router.push("/dashboard");
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      // Store user id for later use
      localStorage.setItem("meatlayer_user_id", data.id.toString());
      localStorage.setItem("meatlayer_username", data.username);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#0d0d0f] flex items-center justify-center">
      <div className="bg-white rounded-[20px] border border-[#e8e8e8] p-10 w-full max-w-[460px]">
        <h1 className="text-[28px] font-normal text-black mb-2">
          Join MeatLayer
        </h1>
        <p className="text-[15px] text-black/50 mb-8">
          Connect your wallet and pick a username to start earning.
        </p>

        {/* Step 1: Connect wallet */}
        <div className="mb-6">
          <label className="block text-[13px] text-black/50 mb-2">
            Wallet
          </label>
          {isConnected ? (
            <div className="flex items-center gap-3 rounded-lg bg-[#f5f5f5] px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-black font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          ) : (
            <ConnectButton />
          )}
        </div>

        {/* Step 2: Username */}
        {isConnected && (
          <>
            <div className="mb-8">
              <label
                htmlFor="username"
                className="block text-[13px] text-black/50 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. satoshi"
                className="w-full rounded-lg border border-[#e8e8e8] px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#e62f5e] transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading || !username.trim()}
              className="w-full rounded-[10px] bg-[#e62f5e] py-3.5 text-[16px] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
