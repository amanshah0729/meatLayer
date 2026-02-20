"use client";

import Link from "next/link";
import { useState } from "react";

const imgBackground =
  "http://localhost:3845/assets/c16cf0f717e978a05ae09e177469da49ed70bd2e.png";
const imgBackgroundOverlay =
  "http://localhost:3845/assets/0224b988f55a8be6ad57362233d3123ac0a7e183.png";
const imgWaiting =
  "http://localhost:3845/assets/7f5c3bd1f872a4be1dd8d60fd010eefecc60a79e.png";

const TASKS = [
  {
    id: "1",
    tag: "Peer-to-peer payment",
    tagColor: "border-pink-400 text-pink-600",
    description: "Confirm which contact the user means before sending a message.",
    confidence: 39,
    risk: "High risk",
    riskColor: "text-red-600",
    riskDot: "bg-red-500",
    trophy: "+182",
  },
  {
    id: "2",
    tag: "E-commerce",
    tagColor: "border-purple-400 text-purple-600",
    description: "Choose which item to buy for a user.",
    confidence: 62,
    risk: "Moderate risk",
    riskColor: "text-amber-600",
    riskDot: "bg-amber-500",
    trophy: "+79",
  },
];

const SAMPLE_NOTIFICATIONS = [
  "New message from user",
  "Task requires approval",
  "AI confidence updated",
  "Risk level changed",
];

const TASK_TYPES = ["Peer-to-peer payment", "E-commerce"] as const;

export default function DashboardPage() {
  const [notificationsByTask, setNotificationsByTask] = useState<
    Record<string, string[]>
  >({});
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(
    new Set(TASK_TYPES)
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleTaskType = (type: string) => {
    setSelectedTaskTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredTasks = TASKS.filter((task) =>
    selectedTaskTypes.has(task.tag)
  );

  const addNotification = (taskId: string) => {
    const list = notificationsByTask[taskId] ?? [];
    const next =
      SAMPLE_NOTIFICATIONS[list.length % SAMPLE_NOTIFICATIONS.length];
    setNotificationsByTask((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), next],
    }));
  };
  return (
    <main className="min-h-screen w-full bg-[#0d0d0f] text-white relative overflow-hidden">
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
          <nav className="flex items-center gap-[45px] font-normal text-[12px] text-white">
            <Link href="/" className="hover:text-white/90">
              MeatLayer
            </Link>
            <Link href="#" className="hover:text-white/90">
              How it works
            </Link>
            <Link href="#" className="hover:text-white/90">
              About
            </Link>
          </nav>
          <button
            type="button"
            className="rounded-[5px] bg-[#e62f5e] px-6 py-[11px] text-[14px] text-white hover:bg-[#d12852] transition-colors"
          >
            Profile
          </button>
        </header>

        {/* Task type - above main container (Figma 18:433) */}
        <div className="mb-6 relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            className="flex items-center justify-between gap-2 rounded-lg bg-[#3C3B43] px-5 py-3 min-w-[220px] text-left text-sm text-white/80 hover:bg-[#45444c] transition-colors"
          >
            <span>Task type</span>
            <svg
              className={`w-4 h-4 shrink-0 text-white transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 rounded-md border border-[#e8e8e8] bg-white shadow-lg py-1 min-w-[220px]">
              {TASK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleTaskType(type)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-black hover:bg-black/[0.04]"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selectedTaskTypes.has(type)
                        ? "border-[#e62f5e] bg-[#e62f5e]"
                        : "border-black/30"
                    }`}
                  >
                    {selectedTaskTypes.has(type) && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main container */}
        <section className="rounded-[20px] border border-[#e8e8e8] bg-white text-black overflow-hidden min-h-[600px]">
          {/* Column headers - inside container */}
          <div className="grid grid-cols-[1fr_140px_140px_100px] gap-6 items-center px-8 py-6 border-b border-[#e8e8e8]">
            <span className="text-sm font-medium text-black">Task</span>
            <span className="text-sm text-black/50">AI confidence</span>
            <span className="text-sm text-black/50">Risk</span>
            <span className="text-sm text-black/50">Trophy</span>
          </div>

          {/* Empty state or task rows */}
          {filteredTasks.length === 0 ? (
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
          ) : (
          <div className="divide-y divide-[#e8e8e8]">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="px-8 py-5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                onClick={() => addNotification(task.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && addNotification(task.id)
                }
              >
                <div className="grid grid-cols-[1fr_140px_140px_100px] gap-6 items-start">
                  <div>
                    <span
                      className={`inline-block rounded-md border px-3 py-1 text-xs ${task.tagColor} mb-2`}
                    >
                      {task.tag}
                    </span>
                    <p className="text-sm text-black">{task.description}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${task.confidence < 50 ? "text-red-600" : "text-red-600"}`}>
                      {task.confidence}%
                    </p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${task.confidence}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.riskDot}`}
                    />
                    <span className={`text-sm ${task.riskColor}`}>
                      {task.risk}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <span>🏆</span>
                    <span className="text-sm font-medium">{task.trophy}</span>
                  </div>
                </div>
                {/* Notifications stack */}
                {(notificationsByTask[task.id]?.length ?? 0) > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-[#e8e8e8] space-y-2">
                    {notificationsByTask[task.id].map((msg, i) => (
                      <div
                        key={i}
                        className="text-xs text-black/70 bg-black/[0.04] rounded px-3 py-2"
                      >
                        {msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </section>
      </div>
    </main>
  );
}
