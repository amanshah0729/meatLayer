"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { TaskRow } from "@/lib/frontend-types";
import { getRiskFromImportance } from "@/lib/frontend-types";

const imgImage3 =
  "http://localhost:3845/assets/c16cf0f717e978a05ae09e177469da49ed70bd2e.png";
const imgImage4 =
  "http://localhost:3845/assets/0224b988f55a8be6ad57362233d3123ac0a7e183.png";
const imgImage5 =
  "http://localhost:3845/assets/5c34cbbecfbf6247a412380f7f5ec58a3ed6cf35.png";
const imgVector1 =
  "http://localhost:3845/assets/32e94eb92542f965790cc5fb9b1f1a4aec6ff4f8.svg";
const imgVector2 =
  "http://localhost:3845/assets/16ee50e1e908c69e15a5e769c716bae48f1cbab1.svg";
const imgSubtract =
  "http://localhost:3845/assets/80cf2827ed37bb69f33005c9ee5e511303bdaedc.png";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
  const confidence = payload?.ai_confidence ?? 0;
  const risk = getRiskFromImportance(task.importance_level);
  const options = payload?.options ?? [];
  const taskType = payload?.task_type ?? "Unknown";

  const handleSubmit = () => {
    if (!selectedOption) return;
    setSubmitted(true);
    // In a real implementation, this would POST the response to the API
  };

  return (
    <div
      className="bg-white relative w-full min-h-screen overflow-hidden"
      data-name="task-detail"
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

      {/* White card container */}
      <div className="absolute bg-white border border-[#e8e8e8] border-solid left-[136px] right-[136px] overflow-clip rounded-[20px] top-[193px] pb-[60px]">
        {/* Top row: tag, trophy, risk */}
        <div className="flex items-center justify-between px-[73px] pt-[67px]">
          <div className="bg-[#f7f7f7] flex h-[34px] items-center justify-center px-5 py-3 rounded-[5px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[15.7px] text-[rgba(0,0,0,0.5)]">
              {taskType}
            </p>
          </div>

          <div className="bg-[#fff5de] flex gap-[6px] h-[34px] items-center justify-center px-5 py-3 rounded-[5px]">
            <div className="h-[16px] relative w-[17px]">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  alt=""
                  className="absolute h-[284.89%] left-[-205.41%] max-w-none top-[-91.67%] w-[508.33%]"
                  src={imgImage5}
                />
              </div>
            </div>
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[15.7px] text-black">
              +{task.min_trophies}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`${risk.dotColor} size-[7.87px]`} />
            <p className={`font-['Inter_Tight:Regular',sans-serif] font-normal text-[15.7px] ${risk.color}`}>
              {risk.label}
            </p>
          </div>
        </div>

        {/* Confidence text */}
        <p className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[0] text-[#e62f5e] text-[15.7px] text-right pr-[73px] mt-[63px]">
          <span className="leading-[normal] text-[rgba(0,0,0,0.5)]">Agent is </span>
          <span className="leading-[normal]">{confidence}% confident</span>
        </p>

        {/* Main instruction heading + AI avatar */}
        <div className="flex gap-6 px-[73px] mt-4">
          <div className="flex-1">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] text-[35.5px] text-black max-w-[500px]">
              {task.worker_instructions}
            </p>
          </div>
        </div>

        {/* AI action section */}
        <div className="flex gap-4 px-[73px] mt-[40px]">
          <div className="flex flex-col gap-[11px] max-w-[427px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[16.6px] text-[rgba(0,0,0,0.5)]">
              AI action
            </p>
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[20.8px] text-black">
              {payload?.ai_action ?? "N/A"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-[73px] mt-[30px] h-px bg-[#e8e8e8]" />

        {/* Info boxes: User input, AI reasoning, AI confidence */}
        <div className="flex gap-[4px] px-[73px] mt-[30px]">
          <div className="bg-[#f7f7f7] flex flex-col items-start justify-between px-[17px] py-[16px] rounded-[10px] w-[195px] h-[195px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-[rgba(0,0,0,0.5)]">
              User input
            </p>
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[14px] text-black whitespace-pre-wrap">
              {payload?.user_input ?? "N/A"}
            </p>
          </div>

          <div className="bg-[#f7f7f7] flex flex-col items-start justify-between px-[17px] py-[16px] rounded-[10px] w-[195px] h-[195px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-[rgba(0,0,0,0.5)]">
              AI reasoning
            </p>
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[14px] text-black whitespace-pre-wrap">
              {payload?.ai_reasoning ?? "N/A"}
            </p>
          </div>

          <div className="bg-[#f7f7f7] flex flex-col items-start justify-between px-[17px] py-[16px] rounded-[10px] w-[195px] h-[195px]">
            <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-[rgba(0,0,0,0.5)]">
              AI confidence
            </p>
            <div className="w-full">
              <p className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[#e62f5e] text-[30px]">
                {confidence}%
              </p>
              <div className="relative mt-2">
                <div className="bg-[#d9d9d9] h-[14px] rounded-[41px] w-full" />
                <div
                  className="bg-[#e62f5e] h-[14px] rounded-[41px] absolute top-0 left-0"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Options cards (dynamic from input_payload.options) */}
        {options.length > 0 && (
          <div className="flex gap-6 justify-center px-[73px] mt-[40px]">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setSelectedOption(
                    selectedOption === option.id ? null : option.id
                  )
                }
                disabled={submitted}
                className={`flex flex-col gap-[21px] items-center justify-center overflow-clip px-[23px] py-[19px] rounded-[10px] w-[333px] cursor-pointer transition-colors ${
                  selectedOption === option.id
                    ? "border-2 border-[#e62f5e] bg-[#fffbfc]"
                    : "border border-transparent bg-[#f7f7f7]"
                }`}
              >
                {/* Option image */}
                {option.image_url && (
                  <div className="h-[240px] overflow-clip rounded-[400px] w-[246px]">
                    <img
                      alt={option.label}
                      className="w-full h-full object-cover"
                      src={option.image_url}
                    />
                  </div>
                )}

                {/* Option label */}
                <p className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] text-[20px] text-black text-center w-full">
                  {option.label}
                </p>

                {/* Option metadata */}
                {option.metadata && Object.keys(option.metadata).length > 0 && (
                  <div className="bg-white w-full overflow-clip rounded-md px-4 py-3">
                    <div className="flex flex-col gap-[16px] items-center w-full">
                      {Object.entries(option.metadata).map(
                        ([key, value], idx, arr) => (
                          <div key={key} className="w-full">
                            <div className="flex items-center justify-between text-[12px] w-full">
                              <p className="text-black capitalize">
                                {key.replace(/_/g, " ")}
                              </p>
                              <p className="text-[rgba(0,0,0,0.5)] tracking-[0.12px] text-right">
                                {value}
                              </p>
                            </div>
                            {idx < arr.length - 1 && (
                              <div className="h-px bg-[#e8e8e8] w-full mt-3" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Text/yes-no/numeric fallback for tasks without options */}
        {options.length === 0 && !submitted && (
          <div className="px-[73px] mt-[40px]">
            {task.expected_response_type === "yes_no" ? (
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
                <label className="text-sm text-[rgba(0,0,0,0.5)]">
                  Your response
                </label>
                <textarea
                  className="bg-[#f7f7f7] rounded-[10px] px-4 py-3 text-black text-sm min-h-[120px] resize-y border border-transparent focus:border-[#e62f5e] focus:outline-none transition-colors"
                  placeholder="Type your response here..."
                  onChange={(e) =>
                    setSelectedOption(e.target.value || null)
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        {!submitted ? (
          <div className="px-[73px] mt-[40px]">
            <button
              type="button"
              disabled={!selectedOption}
              onClick={handleSubmit}
              className={`w-full h-[84px] overflow-clip rounded-[10px] transition-colors ${
                selectedOption
                  ? "cursor-pointer border border-[#9a193a] bg-[#e62f5e]"
                  : "cursor-not-allowed border border-[#9e9e9e] bg-[#9e9e9e]"
              }`}
            >
              <span
                className={`font-['Inter_Tight:Regular',sans-serif] font-normal text-[20px] ${
                  selectedOption ? "text-white" : "text-white/80"
                }`}
              >
                Submit
              </span>
            </button>
          </div>
        ) : (
          <div className="px-[73px] mt-[40px]">
            <div className="w-full h-[84px] rounded-[10px] bg-green-500 flex items-center justify-center">
              <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[20px] text-white">
                Response submitted!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="absolute left-[130px] right-[130px] top-[42px]">
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
