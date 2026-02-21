"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const imgImage3 = "/image%204.png";
const imgImage4 = "/image%204.png";

export default function Home() {
  const [showSignup, setShowSignup] = useState(false);
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
        body: JSON.stringify({ wallet_address: address, username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) { router.push("/dashboard"); return; }
        throw new Error(data.error || "Registration failed");
      }
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
    <div
      className="bg-white relative w-full h-[1198px] overflow-hidden"
      data-name="landing"
    >
      {/* Background images */}
      <div className="-translate-x-1/2 absolute h-[1198px] left-1/2 top-[-48px] w-[2138px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            alt=""
            className="absolute left-0 max-w-none size-full top-0"
            src={imgImage3}
          />
        </div>
      </div>
      <div className="absolute h-[1155px] left-[-162px] top-[-17px] w-[2061px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <img
            alt=""
            className="absolute max-w-none object-cover size-full"
            src={imgImage4}
          />
          <div className="absolute bg-gradient-to-r from-[rgba(0,0,0,0.2)] inset-0 to-[rgba(0,0,0,0.2)]" />
        </div>
      </div>

      {/* Hero text */}
      <p className="absolute font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] left-[calc(50%-732px)] text-[40px] text-white top-[111px]">
        Humans are the original processors.
      </p>

      {/* Landing card */}
      <div className="absolute bg-white border border-[#e8e8e8] border-solid left-[136px] right-[136px] overflow-clip rounded-[20px] top-[193px] flex flex-col items-center justify-center py-[120px]">
        <h1 className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[48px] text-black text-center leading-tight max-w-[700px]">
          The human layer for AI agents
        </h1>
        <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.5)] text-center mt-6 max-w-[500px]">
          Earn rewards by helping AI agents make decisions they can&apos;t make on
          their own.
        </p>
        <button
          type="button"
          onClick={() => setShowSignup(true)}
          className="mt-10 bg-[#e62f5e] flex items-center justify-center px-10 py-4 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[18px] text-white">
            Get started
          </span>
        </button>
      </div>

      {/* Header */}
      <div className="absolute left-[130px] right-[130px] top-[42px]">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-4 items-center font-['Inter_Tight:Regular',sans-serif] font-normal text-[13px] text-white">
            <p className="mr-6">MeatLayer</p>
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
          </div>
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="bg-[#e62f5e] flex items-center justify-center px-[24px] py-[11px] rounded-[5px] hover:opacity-90 transition-opacity"
          >
            <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[14px] text-white">
              Sign up
            </span>
          </button>
        </div>
      </div>

      {/* Sign up modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] border border-[#e8e8e8] p-10 w-full max-w-[460px] relative">
            <button
              type="button"
              onClick={() => setShowSignup(false)}
              className="absolute top-4 right-4 text-black/40 hover:text-black text-xl leading-none"
            >
              &times;
            </button>

            <h2 className="text-[28px] font-normal text-black mb-2">
              Join MeatLayer
            </h2>
            <p className="text-[15px] text-black/50 mb-8">
              Connect your wallet and pick a username to start earning.
            </p>

            {/* Step 1: Connect wallet */}
            <div className="mb-6">
              <label className="block text-[13px] text-black/50 mb-2">Wallet</label>
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

            {/* Step 2: Username + submit */}
            {isConnected && (
              <>
                <div className="mb-8">
                  <label htmlFor="username" className="block text-[13px] text-black/50 mb-2">
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

                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

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
        </div>
      )}
    </div>
  );
}
