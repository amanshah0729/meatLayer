"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TaskRow } from "@/lib/frontend-types";
import { getRiskFromImportance } from "@/lib/frontend-types";

const imgBackground = "/image%204.png";
const imgBackgroundOverlay = "/image%204.png";
const imgWaiting = "/image-removebg-preview%201.png";

interface UserInfo {
  username: string;
  available_balance: number;
  trophies: number;
  tasks_done: number;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [cashingOut, setCashingOut] = useState(false);
  const [cashoutMsg, setCashoutMsg] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("meatlayer_user_id");

    async function fetchTasks() {
      try {
        let url = "/api/dashboard/tasks?status=open";
        if (userId) {
          url = `/api/tasks/available?user_id=${userId}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data: TaskRow[] = await res.json();
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    async function fetchUser() {
      if (!userId) return;
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch {}
    }

    fetchTasks();
    fetchUser();
  }, []);

  return (
    <main className="min-h-screen w-full bg-[#0d0d0f] text-white relative">
      {/* Background - gradient base + cosmic images (from Figma) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] via-[#12121a] to-[#0d0d0f]" />
      <div className="absolute inset-0">
        <div className="absolute -translate-x-1/2 left-1/2 -top-12 h-[1198px] w-[2138px] opacity-90">
          <img
            alt=""
            className="absolute inset-0 max-w-none object-cover w-full h-full"
            src={imgBackground}
          />
        </div>
        <div className="absolute -left-40 -top-4 h-[1155px] w-[2061px] opacity-80">
          <img
            alt=""
            className="absolute inset-0 max-w-none object-cover w-full h-full"
            src={imgBackgroundOverlay}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/20" />
        </div>
      </div>

      <div className="relative z-10 pl-[130px] pr-[130px] pt-[42px] pb-8">
        {/* Header - matches main page */}
        <header className="flex items-center justify-between mb-12">
          <nav className="flex items-center gap-4 font-normal text-[13px]">
            <Link href="/" className="text-white hover:text-white/90 mr-6">
              MeatLayer
            </Link>
            <Link
              href="/dashboard"
              className="rounded-[5px] bg-[#e62f5e] px-4 py-[10px] text-white transition-all"
            >
              Workers
            </Link>
            <Link
              href="/playground"
              className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all"
            >
              Playground
            </Link>
            <Link
              href="/agents"
              className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all"
            >
              My Agents
            </Link>
            <Link
              href="/agents/create"
              className="rounded-[5px] bg-white/10 px-4 py-[10px] text-white/60 hover:text-white hover:bg-white/15 transition-all"
            >
              Create iNFT
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <button
                  type="button"
                  disabled={cashingOut || (user.available_balance || 0) < 5}
                  onClick={async () => {
                    setCashingOut(true);
                    setCashoutMsg(null);
                    try {
                      const userId = localStorage.getItem("meatlayer_user_id");
                      const res = await fetch("/api/users/cashout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: parseInt(userId || "0") }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      setCashoutMsg(`Sent ${data.amount} MON! Tx: ${data.tx_hash?.slice(0, 10)}...`);
                      setUser((prev) => prev ? { ...prev, available_balance: 0 } : prev);
                    } catch (err) {
                      setCashoutMsg(err instanceof Error ? err.message : "Cashout failed");
                    } finally {
                      setCashingOut(false);
                    }
                  }}
                  className="rounded-[5px] bg-[#e62f5e] px-4 py-[10px] text-[13px] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {cashingOut ? "Sending..." : "Claim"}
                </button>
                <div className="flex items-center gap-2 bg-white/10 rounded-[5px] px-4 py-[10px]">
                  <span className="text-[13px] text-white/60">Balance</span>
                  <span className="text-[14px] text-white font-medium">{user.available_balance || 0} MON</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-[5px] px-4 py-[10px]">
                  <span className="text-[14px]">🏆</span>
                  <span className="text-[14px] text-white font-medium">{user.trophies || 0}</span>
                </div>
              </>
            )}
            <span className="text-[13px] text-white/60">{user?.username || (typeof window !== "undefined" ? localStorage.getItem("meatlayer_username") : "") || ""}</span>
            {cashoutMsg && (
              <span className="text-[12px] text-white/70 max-w-[200px] truncate">{cashoutMsg}</span>
            )}
          </div>
        </header>

        {/* Hero text */}
        <p className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] text-[40px] text-white mb-8">
          Humans are the original processors.
        </p>

        {/* Main container */}
        <section className="rounded-[20px] border border-[#e8e8e8] bg-white text-black overflow-hidden min-h-[600px]">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_140px_140px_100px] gap-6 items-center px-8 py-6 border-b border-[#e8e8e8]">
            <span className="text-sm font-medium text-black">Task</span>
            <span className="text-sm text-black/50">AI confidence</span>
            <span className="text-sm text-black/50">Risk</span>
            <span className="text-sm text-black/50">Trophy</span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 px-8">
              <div className="animate-spin h-8 w-8 border-2 border-[#e62f5e] border-t-transparent rounded-full mb-4" />
              <p className="text-lg text-black/50">Loading tasks...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 px-8">
              <p className="text-lg text-red-500 mb-2">Error loading tasks</p>
              <p className="text-sm text-black/50">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-8">
              <div className="mb-6 w-[200px] h-[200px] flex items-center justify-center">
                <img
                  src={imgWaiting}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-lg text-black/50">Waiting on tasks...</p>
            </div>
          )}

          {/* Task rows */}
          {!loading && !error && tasks.length > 0 && (
            <div className="divide-y divide-[#e8e8e8]">
              {tasks.map((task) => {
                const risk = getRiskFromImportance(task.importance_level);
                const confidence = task.input_payload?.ai_confidence ?? 0;
                const taskType = task.input_payload?.task_type || "General";

                return (
                  <Link
                    key={task.id}
                    href={`/task/${task.id}`}
                    className="block px-8 py-5 hover:bg-black/[0.02] transition-colors"
                  >
                    <div className="grid grid-cols-[1fr_140px_140px_100px] gap-6 items-start">
                      {/* Task info */}
                      <div>
                        <span className="inline-block rounded-md border border-pink-400 text-pink-600 px-3 py-1 text-xs mb-2">
                          {taskType}
                        </span>
                        <p className="text-sm text-black">
                          {task.worker_instructions}
                        </p>
                      </div>

                      {/* AI confidence */}
                      <div>
                        <p className="text-sm font-medium text-[#e62f5e]">
                          {confidence}%
                        </p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#e62f5e]"
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                      </div>

                      {/* Risk */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${risk.dotColor}`}
                        />
                        <span className={`text-sm ${risk.color}`}>
                          {risk.label}
                        </span>
                      </div>

                      {/* Trophy */}
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <span>🏆</span>
                        <span className="text-sm font-medium">
                          +{task.trophy_reward ?? task.min_trophies}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
