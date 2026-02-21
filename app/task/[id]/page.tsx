"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { TaskRow } from "@/lib/frontend-types";
import { getRiskFromImportance, getConfidenceColor } from "@/lib/frontend-types";

const imgBg = "/image%204.png";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/dashboard/tasks/${taskId}`);
        if (!res.ok) throw new Error("Task not found");
        const data: TaskRow = await res.json();
        setTask(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [taskId]);

  async function handleSubmit() {
    if (!selectedOption || !task) return;
    setSubmitting(true);
    setSubmitError(null);

    const userId = localStorage.getItem("meatlayer_user_id");
    if (!userId) {
      setSubmitError("You need to sign up first");
      setSubmitting(false);
      return;
    }

    try {
      const acceptRes = await fetch(`/api/tasks/${task.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(userId) }),
      });

      if (!acceptRes.ok) {
        const err = await acceptRes.json();
        throw new Error(err.error || "Failed to accept task");
      }

      const completeRes = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(userId),
          response: { answer: selectedOption },
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || "Failed to submit response");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#0d0d0f] min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#e62f5e] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-[#0d0d0f] min-h-screen flex flex-col items-center justify-center text-white gap-4">
        <p className="text-xl">Task not found</p>
        <Link href="/dashboard" className="text-[#e62f5e] underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const payload = task.input_payload;
  const risk = getRiskFromImportance(task.importance_level);
  const aiConfidence = payload?.ai_confidence ?? 0;
  const confidenceColor = getConfidenceColor(aiConfidence);
  const options = payload?.options ?? [];
  const hasOptions = options.length > 0;

  return (
    <div className="bg-[#0d0d0f] relative w-full min-h-screen" data-name="task-detail">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="-translate-x-1/2 absolute h-[1198px] left-1/2 top-[-48px] w-[2138px]">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgBg} />
        </div>
        <div className="absolute h-[1155px] left-[-162px] top-[-17px] w-[2061px]">
          <img alt="" className="absolute max-w-none object-cover size-full" src={imgBg} />
          <div className="absolute bg-gradient-to-r from-black/20 inset-0 to-black/20" />
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 px-[130px] pt-[42px] pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-[45px] items-center font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-white">
            <Link href="/">MeatLayer</Link>
            <Link href="#">How it works</Link>
            <Link href="#">About</Link>
          </div>
          <Link
            href="/dashboard"
            className="bg-[#e62f5e] flex items-center justify-center px-[24px] py-[11px] rounded-[5px] hover:opacity-90 transition-opacity"
          >
            <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[14px] text-white">
              Dashboard
            </span>
          </Link>
        </div>
      </div>

      {/* Hero text */}
      <div className="relative z-10 px-[136px] pt-[100px]">
        <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[40px] text-white leading-[normal]">
          Humans are the original processors.
        </p>
      </div>

      {/* White card */}
      <div className="relative z-10 mx-[136px] mt-[30px] mb-[60px] bg-white border border-[#e8e8e8] rounded-[20px] overflow-clip">
        {/* Top badge row */}
        <div className="flex items-center justify-between px-[60px] pt-[50px]">
          <div className="bg-[#f7f7f7] px-5 py-2 rounded-[5px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] text-[14px] text-black/50">
              {payload?.task_type || "Task"}
            </p>
          </div>

          <div className="bg-[#fff5de] flex items-center gap-1.5 px-5 py-2 rounded-[5px]">
            <span className="text-[14px]">🏆</span>
            <p className="font-['Inter_Tight:Regular',sans-serif] text-[14px] text-black font-medium">
              +{task.trophy_reward ?? task.min_trophies}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`${risk.dotColor} rounded-sm size-[8px]`} />
            <p className={`font-['Inter_Tight:Regular',sans-serif] text-[14px] ${risk.color}`}>
              {risk.label}
            </p>
          </div>
        </div>

        {/* Two-column content */}
        <div className="flex px-[60px] pt-[30px] pb-[10px] gap-[40px]">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Main instruction heading */}
            <h1 className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[32px] text-black leading-tight max-w-[420px]">
              {task.worker_instructions}
            </h1>

            {/* AI action section */}
            {payload?.ai_action && (
              <div className="mt-8 flex items-start gap-4">
                <div className="w-[50px] h-[50px] rounded-full bg-[#f0f0f0] overflow-hidden shrink-0 flex items-center justify-center">
                  {payload?.image_url ? (
                    <img src={payload.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[20px]">🤖</span>
                  )}
                </div>
                <div>
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[13px] text-black/40 mb-1">
                    AI action
                  </p>
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[15px] text-black leading-relaxed">
                    {payload.ai_action}
                  </p>
                </div>
              </div>
            )}

            {/* Three info boxes */}
            <div className="mt-10 flex gap-1">
              {payload?.user_input && (
                <div className="bg-[#f7f7f7] rounded-[10px] px-4 py-4 flex-1 flex flex-col justify-between min-h-[130px]">
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[11px] text-black/40">
                    User Input
                  </p>
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[13px] text-black mt-3">
                    {payload.user_input}
                  </p>
                </div>
              )}

              {payload?.ai_reasoning && (
                <div className="bg-[#f7f7f7] rounded-[10px] px-4 py-4 flex-1 flex flex-col justify-between min-h-[130px]">
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[11px] text-black/40">
                    AI reasoning
                  </p>
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[13px] text-black mt-3">
                    {payload.ai_reasoning}
                  </p>
                </div>
              )}

              {aiConfidence > 0 && (
                <div className="bg-[#f7f7f7] rounded-[10px] px-4 py-4 flex-1 flex flex-col justify-between min-h-[130px]">
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[11px] text-black/40">
                    AI confidence
                  </p>
                  <div>
                    <p className={`font-['Inter_Tight:Regular',sans-serif] text-[28px] font-normal ${confidenceColor}`}>
                      {aiConfidence}%
                    </p>
                    <div className="flex gap-0.5 mt-1 h-[6px] rounded-full overflow-hidden">
                      <div
                        className="bg-[#e62f5e] rounded-full"
                        style={{ width: `${aiConfidence}%` }}
                      />
                      <div
                        className="bg-[#3b82f6] rounded-full"
                        style={{ width: `${100 - aiConfidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback: show question if no structured fields */}
              {!payload?.user_input && !payload?.ai_reasoning && payload?.question && (
                <div className="bg-[#f7f7f7] rounded-[10px] px-4 py-4 flex-1 flex flex-col justify-between min-h-[130px]">
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[11px] text-black/40">
                    Original question
                  </p>
                  <p className="font-['Inter_Tight:Regular',sans-serif] text-[13px] text-black mt-3">
                    {payload.question}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="w-[55%] shrink-0">
            {/* Agent confidence header */}
            <div className="flex items-center gap-2 mb-4">
              <p className="font-['Inter_Tight:Regular',sans-serif] text-[14px] text-black/60">
                Agent is <span className={`font-medium ${confidenceColor}`}>{aiConfidence}% confident</span>
              </p>
              <div className="w-[28px] h-[28px] rounded-full bg-[#f0f0f0] overflow-hidden flex items-center justify-center">
                <span className="text-[14px]">🤖</span>
              </div>
            </div>

            {/* Option cards */}
            {hasOptions ? (
              <div className="flex gap-3">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => !submitted && setSelectedOption(opt.id)}
                    className={`flex-1 rounded-[16px] p-4 text-left transition-all ${
                      selectedOption === opt.id
                        ? "border-2 border-[#1a1a1a] shadow-lg"
                        : "border border-[#e8e8e8]"
                    } ${submitted ? "pointer-events-none" : "cursor-pointer hover:border-black/30"}`}
                  >
                    {opt.image_url && (
                      <div className="flex justify-center mb-3">
                        <img
                          src={opt.image_url}
                          alt={opt.label}
                          className="w-[120px] h-[120px] rounded-full object-cover"
                        />
                      </div>
                    )}
                    <p className="font-['Inter_Tight:Regular',sans-serif] text-[16px] text-black text-center font-medium">
                      {opt.label}
                    </p>
                    {opt.metadata && Object.keys(opt.metadata).length > 0 && (
                      <div className="mt-3 space-y-0">
                        {Object.entries(opt.metadata).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between py-2 border-t border-[#f0f0f0] first:border-t-0"
                          >
                            <span className="font-['Inter_Tight:Regular',sans-serif] text-[11px] text-black/50">
                              {key}
                            </span>
                            <span className="font-['Inter_Tight:Regular',sans-serif] text-[11px] text-black/70">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* Fallback: text or yes/no response */
              <div className="mt-4">
                {task.expected_response_type === "yes_no" ? (
                  <div className="flex gap-4">
                    {["yes", "no"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => !submitted && setSelectedOption(opt)}
                        className={`flex-1 py-6 rounded-[16px] text-[18px] font-medium transition-all capitalize ${
                          selectedOption === opt
                            ? "border-2 border-[#1a1a1a] bg-[#fafafa] shadow-lg"
                            : "border border-[#e8e8e8] bg-white hover:border-black/30"
                        } ${submitted ? "pointer-events-none" : "cursor-pointer"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[12px] text-black/40">Your response</p>
                    <textarea
                      className="bg-[#f7f7f7] rounded-[12px] px-4 py-3 text-black text-[14px] min-h-[180px] resize-y border border-transparent focus:border-[#e62f5e] focus:outline-none transition-colors"
                      placeholder="Type your response here..."
                      disabled={submitted}
                      onChange={(e) => setSelectedOption(e.target.value || null)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        {submitError && (
          <p className="text-sm text-red-500 text-center px-[60px] mt-2">{submitError}</p>
        )}

        <div className="px-[60px] pb-[50px] pt-[30px]">
          {!submitted ? (
            <button
              type="button"
              disabled={!selectedOption || submitting}
              onClick={handleSubmit}
              className={`w-full h-[72px] rounded-[12px] transition-all text-[18px] font-['Inter_Tight:Regular',sans-serif] text-white ${
                selectedOption && !submitting
                  ? "bg-[#e62f5e] hover:bg-[#d4284f] cursor-pointer"
                  : "bg-[#ccc] cursor-not-allowed"
              }`}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          ) : (
            <div className="w-full h-[72px] rounded-[12px] bg-green-500 flex flex-col items-center justify-center">
              <span className="font-['Inter_Tight:Regular',sans-serif] text-[18px] text-white">
                Response submitted!
              </span>
              <span className="font-['Inter_Tight:Regular',sans-serif] text-[13px] text-white/80 mt-0.5">
                +{task.price_per_worker} 0G earned
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
