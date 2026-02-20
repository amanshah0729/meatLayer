"use client";

import Link from "next/link";

const imgImage3 =
  "http://localhost:3845/assets/c16cf0f717e978a05ae09e177469da49ed70bd2e.png";
const imgImage4 =
  "http://localhost:3845/assets/0224b988f55a8be6ad57362233d3123ac0a7e183.png";

export default function Home() {
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
        <Link
          href="/dashboard"
          className="mt-10 bg-[#e62f5e] flex items-center justify-center px-10 py-4 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[18px] text-white">
            Browse tasks
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="absolute left-[130px] right-[130px] top-[42px]">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-[45px] items-center font-['Inter_Tight:Regular',sans-serif] font-normal text-[12px] text-white">
            <p>MeatLayer</p>
            <p>How it works</p>
            <p>About</p>
          </div>
          <Link
            href="/dashboard"
            className="bg-[#e62f5e] flex items-center justify-center px-[24px] py-[11px] rounded-[5px] hover:opacity-90 transition-opacity"
          >
            <span className="font-['Inter_Tight:Regular',sans-serif] font-normal text-[14px] text-white">
              Connect wallet
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
