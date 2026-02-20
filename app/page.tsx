"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";

const imgImage3 =
  "http://localhost:3845/assets/c16cf0f717e978a05ae09e177469da49ed70bd2e.png";
const imgImage4 =
  "http://localhost:3845/assets/0224b988f55a8be6ad57362233d3123ac0a7e183.png";
const imgImage5 =
  "http://localhost:3845/assets/5c34cbbecfbf6247a412380f7f5ec58a3ed6cf35.png";
const imgImage10 =
  "http://localhost:3845/assets/7f5c3bd1f872a4be1dd8d60fd010eefecc60a79e.png";
const imgImage6 =
  "http://localhost:3845/assets/32cdf22635d8bdf7e4aa40c91d3a23e1f0187cf5.png";
const imgImage8 =
  "http://localhost:3845/assets/011794ef13a9db98b0ab0810b7f686b592340e9c.png";
const imgSubtract =
  "http://localhost:3845/assets/80cf2827ed37bb69f33005c9ee5e511303bdaedc.png";
const imgVector1 =
  "http://localhost:3845/assets/32e94eb92542f965790cc5fb9b1f1a4aec6ff4f8.svg";
const imgVector2 =
  "http://localhost:3845/assets/16ee50e1e908c69e15a5e769c716bae48f1cbab1.svg";

export default function Home() {
  const [selectedContact, setSelectedContact] = useState<"dad" | "daddy" | null>(null);

  return (
    <div
      className="bg-white relative w-full h-[1198px] overflow-hidden"
      data-name="MacBook Pro 16' - 6"
      data-node-id="14:916"
    >
      <div
        className="-translate-x-1/2 absolute h-[1198px] left-1/2 top-[-48px] w-[2138px]"
        data-name="image 3"
        data-node-id="14:989"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            alt=""
            className="absolute left-0 max-w-none size-full top-0"
            src={imgImage3}
          />
        </div>
      </div>
      <div
        className="absolute h-[1155px] left-[-162px] top-[-17px] w-[2061px]"
        data-name="image 4"
        data-node-id="14:990"
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <img
            alt=""
            className="absolute max-w-none object-cover size-full"
            src={imgImage4}
          />
          <div className="absolute bg-gradient-to-r from-[rgba(0,0,0,0.2)] inset-0 to-[rgba(0,0,0,0.2)]" />
        </div>
      </div>
      <p
        className="absolute font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] left-[calc(50%-732px)] text-[40px] text-white top-[111px]"
        data-node-id="14:991"
      >
        Humans are the original processors.
      </p>
      <div
        className="absolute bg-white border border-[#e8e8e8] border-solid h-[1006px] left-[136px] overflow-clip rounded-[20px] top-[193px] w-[1466px]"
        data-node-id="14:992"
      >
        <div
          className="absolute content-stretch flex items-center justify-between left-[73px] top-[67px] w-[1312.046px]"
          data-node-id="14:993"
        >
          <div
            className="bg-[#f7f7f7] content-stretch flex h-[34.093px] items-center justify-center px-[19.669px] py-[13.113px] relative rounded-[5px] shrink-0 w-[170.464px]"
            data-node-id="14:994"
          >
            <p
              className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[15.735px] text-[rgba(0,0,0,0.5)]"
              data-node-id="14:995"
            >
              Peer-to-peer payment
            </p>
          </div>
          <div
            className="bg-[#fff5de] content-stretch flex gap-[6px] h-[34px] items-center justify-center px-[19.669px] py-[13.113px] relative rounded-[5px] shrink-0 w-[94px]"
            data-node-id="14:996"
          >
            <div
              className="h-[16px] relative shrink-0 w-[17px]"
              data-name="image 5"
              data-node-id="14:997"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  alt=""
                  className="absolute h-[284.89%] left-[-205.41%] max-w-none top-[-91.67%] w-[508.33%]"
                  src={imgImage5}
                />
              </div>
            </div>
            <p
              className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[15.735px] text-black"
              data-node-id="14:998"
            >
              +182
            </p>
          </div>
          <div
            className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0"
            data-node-id="14:999"
          >
            <p
              className="col-1 font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] ml-[17.05px] mt-0 relative row-1 text-[#cb2b2d] text-[15.735px]"
              data-node-id="14:1000"
            >
              High risk
            </p>
            <div
              className="bg-[#cb2b2d] col-1 ml-0 mt-[5.25px] row-1 size-[7.868px]"
              data-node-id="14:1001"
            />
          </div>
        </div>
        <p
          className="absolute font-['Inter_Tight:Regular',sans-serif] font-normal leading-[0] left-[715px] text-[#e62f5e] text-[15.735px] top-[164px]"
          data-node-id="14:1052"
        >
          <span className="leading-[normal] text-[rgba(0,0,0,0.5)]">{`Agent is `}</span>
          <span className="leading-[normal]">67% confident</span>
        </p>
        <p
          className="absolute font-['Inter_Tight:Regular',sans-serif] font-normal h-[121.014px] leading-[normal] left-[73px] text-[35.526px] text-black top-[163px] w-[438px] whitespace-pre-wrap"
          data-node-id="14:1002"
        >
          Confirm which contact the user means before sending a message.
        </p>
        <div
          className="absolute content-stretch flex flex-col font-['Inter_Tight:Regular',sans-serif] font-normal gap-[11.082px] items-start justify-center leading-[normal] left-[192px] top-[354px] w-[427px]"
          data-node-id="14:1003"
        >
          <p
            className="relative shrink-0 text-[16.623px] text-[rgba(0,0,0,0.5)]"
            data-node-id="14:1004"
          >
            AI action
          </p>
          <p
            className="min-w-full relative shrink-0 text-[20.779px] text-black w-[min-content] whitespace-pre-wrap"
            data-node-id="14:1005"
          >
            Send the message “Come over tn? 😘” to another contact.
          </p>
        </div>
        <div
          className="absolute h-0 left-[73px] top-[473px] w-[593.344px]"
          data-node-id="14:1006"
        >
          <div className="absolute inset-[-0.25px_0]">
            <img alt="" className="block max-w-none size-full" src={imgVector1} />
          </div>
        </div>
        <div
          className="absolute bg-[#f7f7f7] left-[73px] overflow-clip rounded-[135px] size-[80px] top-[355px]"
          data-node-id="14:1007"
        >
          <div className="absolute flex h-[80px] items-center justify-center left-[-31px] top-0 w-[142px]">
            <div className="-scale-y-100 flex-none rotate-180">
              <div
                className="h-[80px] relative w-[142px]"
                data-name="image 10"
                data-node-id="18:158"
              >
                <img
                  alt=""
                  className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                  src={imgImage10}
                />
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedContact(selectedContact === "dad" ? null : "dad")}
          className={`absolute content-stretch flex flex-col gap-[21px] h-[512px] items-center justify-center left-[712px] overflow-clip px-[23px] py-[19px] rounded-[10px] top-[197px] w-[333px] cursor-pointer transition-colors ${
            selectedContact === "dad"
              ? "border-2 border-[#e62f5e] bg-[#fffbfc]"
              : "border border-transparent bg-[#f7f7f7]"
          }`}
          data-node-id="14:1008"
        >
          <div
            className="h-[240px] overflow-clip relative rounded-[400px] shrink-0 w-[246px]"
            data-node-id="18:2"
          >
            <div
              className="absolute h-[306px] left-[-115px] top-0 w-[459px]"
              data-name="image 6"
              data-node-id="18:3"
            >
              <img
                alt=""
                className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                src={imgImage6}
              />
            </div>
          </div>
          <p
            className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] min-w-full relative shrink-0 text-[20px] text-black text-center w-[min-content] whitespace-pre-wrap"
            data-node-id="18:9"
          >
            Dad
          </p>
          <div
            className="bg-white h-[146px] overflow-clip relative shrink-0 w-full"
            data-node-id="18:128"
          >
            <div
              className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[16px] items-center left-[calc(50%+0.5px)] top-[16px] w-[356px]"
              data-node-id="18:130"
            >
              <div
                className="content-stretch flex font-['Inter_Tight:Regular',sans-serif] font-normal h-[15px] items-center justify-between leading-[normal] relative shrink-0 text-[12px] w-[254px]"
                data-node-id="18:131"
              >
                <p className="relative shrink-0 text-black" data-node-id="18:132">
                  Recent messages
                </p>
                <p
                  className="relative shrink-0 text-[rgba(0,0,0,0.5)] tracking-[0.12px]"
                  data-node-id="18:133"
                >
                  1 in the last week
                </p>
              </div>
              <div className="h-0 relative shrink-0 w-[356px]" data-node-id="18:134">
                <div className="absolute inset-[-0.25px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgVector2} />
                </div>
              </div>
              <div
                className="content-stretch flex font-['Inter_Tight:Regular',sans-serif] font-normal items-center justify-between leading-[normal] relative shrink-0 text-[12px] w-[254px]"
                data-node-id="18:135"
              >
                <p className="relative shrink-0 text-black" data-node-id="18:136">
                  Last message sent
                </p>
                <p
                  className="relative shrink-0 text-[rgba(0,0,0,0.5)] text-right tracking-[0.12px]"
                  data-node-id="18:137"
                >
                  3 days ago
                </p>
              </div>
              <div className="h-0 relative shrink-0 w-[356px]" data-node-id="18:138">
                <div className="absolute inset-[-0.25px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgVector2} />
                </div>
              </div>
              <div
                className="content-stretch flex font-['Inter_Tight:Regular',sans-serif] font-normal items-center justify-between leading-[normal] relative shrink-0 text-[12px] w-[254px]"
                data-node-id="18:139"
              >
                <p className="relative shrink-0 text-black" data-node-id="18:140">
                  Platform
                </p>
                <p
                  className="relative shrink-0 text-[rgba(0,0,0,0.5)] text-right tracking-[0.12px]"
                  data-node-id="18:141"
                >
                  Whatsapp
                </p>
              </div>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setSelectedContact(selectedContact === "daddy" ? null : "daddy")}
          className={`absolute content-stretch flex flex-col gap-[21px] h-[512px] items-center justify-center left-[1051px] overflow-clip px-[23px] py-[19px] rounded-[10px] top-[197px] w-[333px] cursor-pointer transition-colors ${
            selectedContact === "daddy"
              ? "border-2 border-[#e62f5e] bg-[#fffbfc]"
              : "border border-transparent bg-[#f7f7f7]"
          }`}
          data-node-id="14:1011"
        >
          <div
            className="h-[240px] overflow-clip relative rounded-[300px] shrink-0 w-[246px]"
            data-node-id="18:5"
          >
            <div
              className="absolute h-[306px] left-[-115px] top-0 w-[459px]"
              data-name="image 6"
              data-node-id="18:6"
            >
              <img
                alt=""
                className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                src={imgImage6}
              />
            </div>
            <div
              className="absolute h-[255px] left-[-113px] top-0 w-[454px]"
              data-name="image 8"
              data-node-id="18:7"
            >
              <img
                alt=""
                className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                src={imgImage8}
              />
            </div>
          </div>
          <p
            className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] min-w-full relative shrink-0 text-[20px] text-black text-center w-[min-content] whitespace-pre-wrap"
            data-node-id="18:10"
          >
            Daddy 🤑 💕🍼
          </p>
          <div
            className="bg-white h-[146px] overflow-clip relative shrink-0 w-full"
            data-node-id="18:143"
          >
            <div
              className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[16px] items-center left-[calc(50%+0.5px)] top-[16px] w-[356px]"
              data-node-id="18:144"
            >
              <div
                className="content-stretch flex font-['Inter_Tight:Regular',sans-serif] font-normal h-[15px] items-center justify-between leading-[normal] relative shrink-0 text-[12px] w-[254px]"
                data-node-id="18:145"
              >
                <p className="relative shrink-0 text-black" data-node-id="18:146">
                  Recent messages
                </p>
                <p
                  className="relative shrink-0 text-[rgba(0,0,0,0.5)] tracking-[0.12px]"
                  data-node-id="18:147"
                >
                  1 in the last week
                </p>
              </div>
              <div className="h-0 relative shrink-0 w-[356px]" data-node-id="18:148">
                <div className="absolute inset-[-0.25px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgVector2} />
                </div>
              </div>
              <div
                className="content-stretch flex font-['Inter_Tight:Regular',sans-serif] font-normal items-center justify-between leading-[normal] relative shrink-0 text-[12px] w-[254px]"
                data-node-id="18:149"
              >
                <p className="relative shrink-0 text-black" data-node-id="18:150">
                  Last message sent
                </p>
                <p
                  className="relative shrink-0 text-[rgba(0,0,0,0.5)] text-right tracking-[0.12px]"
                  data-node-id="18:151"
                >
                  3 days ago
                </p>
              </div>
              <div className="h-0 relative shrink-0 w-[356px]" data-node-id="18:152">
                <div className="absolute inset-[-0.25px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgVector2} />
                </div>
              </div>
              <div
                className="content-stretch flex font-['Inter_Tight:Regular',sans-serif] font-normal items-center justify-between leading-[normal] relative shrink-0 text-[12px] w-[254px]"
                data-node-id="18:153"
              >
                <p className="relative shrink-0 text-black" data-node-id="18:154">
                  Platform
                </p>
                <p
                  className="relative shrink-0 text-[rgba(0,0,0,0.5)] text-right tracking-[0.12px]"
                  data-node-id="18:155"
                >
                  Whatsapp
                </p>
              </div>
            </div>
          </div>
        </button>
        <div
          className="absolute bg-[#f7f7f7] content-stretch flex flex-col font-['Inter_Tight:Regular',sans-serif] font-normal items-start justify-between leading-[normal] left-[73px] px-[17px] py-[15.941px] rounded-[10px] size-[195px] top-[514px]"
          data-node-id="14:1012"
        >
          <p
            className="relative shrink-0 text-[12px] text-[rgba(0,0,0,0.5)]"
            data-node-id="14:1013"
          >
            User input
          </p>
          <p
            className="relative shrink-0 text-[14px] text-black w-[164.334px] whitespace-pre-wrap"
            data-node-id="14:1014"
          >
            Finish the conversation with my hubby
          </p>
        </div>
        <div
          className="absolute bg-[#f7f7f7] content-stretch flex flex-col font-['Inter_Tight:Regular',sans-serif] font-normal items-start justify-between leading-[normal] left-[272px] px-[17px] py-[15.941px] rounded-[10px] size-[195px] top-[514px]"
          data-node-id="14:1015"
        >
          <p
            className="relative shrink-0 text-[12px] text-[rgba(0,0,0,0.5)]"
            data-node-id="14:1016"
          >
            AI reasoning
          </p>
          <p
            className="min-w-full relative shrink-0 text-[14px] text-black w-[min-content] whitespace-pre-wrap"
            data-node-id="14:1017"
          >{`Cannot determine which contact the user intends to message: ‘Dad’ HAS multiple entries. `}</p>
        </div>
        <div
          className="absolute bg-[#f7f7f7] content-stretch flex flex-col items-start justify-between left-[471px] px-[17px] py-[15.941px] rounded-[10px] size-[195px] top-[514px]"
          data-node-id="14:1018"
        >
          <p
            className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-[rgba(0,0,0,0.5)] w-[164.333px] whitespace-pre-wrap"
            data-node-id="14:1019"
          >
            AI confidence
          </p>
          <div
            className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full"
            data-node-id="14:1020"
          >
            <p
              className="col-1 font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] ml-0 mt-0 relative row-1 text-[#e62f5e] text-[30px] w-[141.233px] whitespace-pre-wrap"
              data-node-id="14:1021"
            >
              39%
            </p>
            <div
              className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-[49px] place-items-start relative row-1"
              data-node-id="14:1022"
            >
              <div
                className="bg-[#d9d9d9] col-1 h-[14px] ml-[0.29px] mt-[0.06px] rounded-[41px] row-1 w-[160.714px]"
                data-node-id="14:1023"
              />
              <div
                className="bg-[#e62f5e] col-1 h-[14px] ml-0 mt-0 rounded-[41px] row-1 w-[48.988px]"
                data-node-id="14:1024"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={!selectedContact}
          className={`-translate-x-1/2 absolute h-[84px] left-[calc(50%-3.5px)] overflow-clip rounded-[10px] top-[773px] w-[1311px] transition-colors ${
            selectedContact
              ? "cursor-pointer border border-[#9a193a] border-solid bg-[#e62f5e]"
              : "cursor-not-allowed border border-[#9e9e9e] border-solid bg-[#9e9e9e]"
          }`}
          data-node-id="14:1036"
        >
          <span
            className={`absolute font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] left-[calc(50%-30.5px)] text-[20px] top-[calc(50%-12px)] ${
              selectedContact ? "text-white" : "text-white/80"
            }`}
            data-node-id="14:1037"
          >
            Submit
          </span>
        </button>
        <div
          className="absolute flex h-[65.186px] items-center justify-center left-[896.13px] top-[146.03px] w-[132.214px]"
          style={
            {
              "--transform-inner-width": "0",
              "--transform-inner-height": "0",
            } as CSSProperties
          }
        >
          <div className="flex-none rotate-[6.54deg]">
            <div
              className="h-[51.035px] relative w-[127.231px]"
              data-name="Subtract"
              data-node-id="14:1051"
            >
              <img
                alt=""
                className="block max-w-none size-full"
                height="51.035"
                src={imgSubtract}
                width="127.231"
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="absolute contents left-[130px] top-[42px]"
        data-node-id="14:1025"
      >
        <div
          className="absolute content-stretch flex items-center justify-between left-[130px] top-[42px] w-[1468px]"
          data-node-id="14:1026"
        >
          <div
            className="content-stretch flex font-['Inter_Tight:Regular',sans-serif] font-normal gap-[45px] items-center leading-[normal] relative shrink-0 text-[12px] text-white"
            data-node-id="14:1027"
          >
            <p className="relative shrink-0" data-node-id="14:1028">
              MeatLayer
            </p>
            <p className="relative shrink-0" data-node-id="14:1029">
              How it works
            </p>
            <p className="relative shrink-0" data-node-id="14:1030">
              About
            </p>
          </div>
          <Link
            href="/dashboard"
            className="bg-[#e62f5e] content-stretch flex items-center justify-center px-[24px] py-[11px] relative rounded-[5px] shrink-0 hover:opacity-90 transition-opacity"
            data-node-id="14:1033"
          >
            <span
              className="font-['Inter_Tight:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[14px] text-white"
              data-node-id="14:1034"
            >
              Connect wallet
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
