"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { TaskRow } from "@/lib/frontend-types";
import { getRiskFromImportance } from "@/lib/frontend-types";

const imgImage3 = "/image%204.png";
const imgImage4 = "/image%204.png";

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
      // 1. Accept the task
      const acceptRes = await fetch(`/api/tasks/${task.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(userId) }),
      });

      if (!acceptRes.ok) {
        const err = await acceptRes.json();
        throw new Error(err.error || "Failed to accept task");
      }

      // 2. Complete the task with the response
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
  const responseType = task.expected_response_type || "text";

  return (
    <div className="bg-[#0d0d0f] relative w-full min-h-screen" data-name="task-detail">
      {/* Background images - fixed behind content */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="-translate-x-1/2 absolute h-[1198px] left-1/2 top-[-48px] w-[2138px]">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgImage3} />
        </div>
        <div className="absolute h-[1155px] left-[-162px] top-[-17px] w-[2061px]">
          <img alt="" className="absolute max-w-none object-cover size-full" src={imgImage4} />
          <div className="absolute bg-gradient-to-r from-[rgba(0,0,0,0.2)] inset-0 to-[rgba(0,0,0,0.2)]" />
        </div>
      </div>

      {/* Content - normal flow, scrollable */}
      <div className="relative z-10 px-[136px] pt-[120px] pb-[60px]">
        {/* White card container */}
        <div className="bg-white border border-[#e8e8e8] border-solid rounded-[20px] pb-[60px]">
        {/* Top row: type tag, trophy, risk, reward */}
        <div className="flex items-center justify-between px-[73px] pt-[67px]">
          <div className="bg-[#f7f7f7] flex h-[34px] items-center justify-center px-5 py-3 rounded-[5px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[15.7px] text-[rgba(0,0,0,0.5)]">
              {responseType}
            </p>
          </div>

          <div className="bg-[#fff5de] flex gap-[6px] h-[34px] items-center justify-center px-5 py-3 rounded-[5px]">
            <span className="text-[14px]">🏆</span>
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[15.7px] text-black">
              +{task.trophy_reward ?? task.min_trophies}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`${risk.dotColor} rounded-full size-[7.87px]`} />
            <p className={`font-['Inter_Tight:Regular',sans-serif] font-normal text-[15.7px] ${risk.color}`}>
              {risk.label}
            </p>
          </div>

          <div className="bg-[#e8ffe8] flex h-[34px] items-center justify-center px-5 py-3 rounded-[5px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[15.7px] text-green-700">
              {task.price_per_worker} MON
            </p>
          </div>
        </div>

        {/* Main instruction heading */}
        <div className="px-[73px] mt-[40px]">
          <p className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] text-[35.5px] text-black max-w-[700px]">
            {task.worker_instructions}
          </p>
        </div>

        {/* Original request from AI agent */}
        <div className="px-[73px] mt-[30px]">
          <div className="flex gap-[4px]">
            {payload?.question && (
              <div className="bg-[#f7f7f7] flex flex-col items-start justify-between px-[17px] py-[16px] rounded-[10px] flex-1 min-h-[120px]">
                <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-[rgba(0,0,0,0.5)]">
                  Original question
                </p>
                <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[14px] text-black whitespace-pre-wrap mt-2">
                  {payload.question}
                </p>
              </div>
            )}

            {payload?.image_url && (
              <div className="bg-[#f7f7f7] flex flex-col items-start px-[17px] py-[16px] rounded-[10px] w-[195px] min-h-[120px]">
                <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-[rgba(0,0,0,0.5)] mb-2">
                  Attached image
                </p>
                <img
                  src={payload.image_url}
                  alt="Task attachment"
                  className="rounded-md max-h-[150px] object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            <div className="bg-[#f7f7f7] flex flex-col items-start justify-between px-[17px] py-[16px] rounded-[10px] w-[195px] min-h-[120px]">
              <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-[rgba(0,0,0,0.5)]">
                Importance
              </p>
              <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[30px] text-black">
                {task.importance_level}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-[73px] mt-[30px] h-px bg-[#e8e8e8]" />

        {/* Response input */}
        {!submitted && (
          <div className="px-[73px] mt-[40px]">
            {responseType === "yes_no" ? (
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedOption("yes")}
                  className={`px-12 py-4 rounded-[10px] text-lg font-medium transition-colors ${
                    selectedOption === "yes"
                      ? "border-2 border-[#e62f5e] bg-[#fffbfc] text-[#e62f5e]"
                      : "border border-transparent bg-[#f7f7f7] text-black"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOption("no")}
                  className={`px-12 py-4 rounded-[10px] text-lg font-medium transition-colors ${
                    selectedOption === "no"
                      ? "border-2 border-[#e62f5e] bg-[#fffbfc] text-[#e62f5e]"
                      : "border border-transparent bg-[#f7f7f7] text-black"
                  }`}
                >
                  No
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-[600px] mx-auto">
                <label className="text-sm text-[rgba(0,0,0,0.5)]">Your response</label>
                <textarea
                  className="bg-[#f7f7f7] rounded-[10px] px-4 py-3 text-black text-sm min-h-[120px] resize-y border border-transparent focus:border-[#e62f5e] focus:outline-none transition-colors"
                  placeholder="Type your response here..."
                  onChange={(e) => setSelectedOption(e.target.value || null)}
                />
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        {submitError && (
          <p className="text-sm text-red-500 text-center px-[73px] mt-4">{submitError}</p>
        )}

        <div className="px-[73px] mt-[40px]">
          {!submitted ? (
            <button
              type="button"
              disabled={!selectedOption || submitting}
              onClick={handleSubmit}
              className={`w-full h-[84px] overflow-clip rounded-[10px] transition-colors ${
                selectedOption && !submitting
                  ? "cursor-pointer border border-[#9a193a] bg-[#e62f5e]"
                  : "cursor-not-allowed border border-[#9e9e9e] bg-[#9e9e9e]"
              }`}
            >
              <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[20px] text-white">
                {submitting ? "Submitting..." : "Submit"}
              </span>
            </button>
          ) : (
            <div className="w-full h-[84px] rounded-[10px] bg-green-500 flex flex-col items-center justify-center">
              <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[20px] text-white">
                Response submitted!
              </span>
              <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[14px] text-white/80 mt-1">
                +{task.price_per_worker} MON earned
              </span>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Header - fixed at top */}
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
    </div>
  );
}
