"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden">
      {/* ── Sky + Mountain Background ── */}
      <div className="absolute inset-0">
        {/* Sky gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #5b9bd5 0%, #7cb8e8 30%, #a8d4f0 55%, #d4e9f5 70%, #e8f0e0 80%, #4a8c3f 82%, #3d7a35 88%, #2d6628 100%)",
          }}
        />

        {/* Misty mountains — layer 1 (far) */}
        <div
          className="absolute bottom-[18%] left-0 right-0 h-[30%]"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(100,140,100,0.3) 40%, rgba(60,120,50,0.6) 100%)",
            clipPath:
              "polygon(0% 60%, 5% 45%, 12% 52%, 20% 35%, 30% 48%, 40% 30%, 50% 42%, 58% 28%, 65% 40%, 75% 32%, 85% 45%, 92% 38%, 100% 50%, 100% 100%, 0% 100%)",
          }}
        />

        {/* Misty mountains — layer 2 (mid) */}
        <div
          className="absolute bottom-[14%] left-0 right-0 h-[28%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(55,130,55,0.5) 0%, rgba(45,102,40,0.8) 100%)",
            clipPath:
              "polygon(0% 70%, 8% 55%, 15% 65%, 25% 45%, 35% 58%, 45% 40%, 55% 55%, 62% 42%, 72% 52%, 80% 38%, 90% 50%, 95% 42%, 100% 55%, 100% 100%, 0% 100%)",
          }}
        />

        {/* Foreground hills */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[22%]"
          style={{
            background:
              "linear-gradient(180deg, #3a7d32 0%, #2d6628 40%, #245520 100%)",
            clipPath:
              "polygon(0% 40%, 10% 30%, 25% 38%, 40% 25%, 55% 35%, 70% 22%, 85% 32%, 100% 28%, 100% 100%, 0% 100%)",
          }}
        />

        {/* Soft atmospheric haze */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.15) 0%, transparent 60%)",
          }}
        />

        {/* Subtle cloud wisps */}
        <div
          className="absolute top-[10%] left-[10%] w-[35%] h-[8%] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[5%] right-[15%] w-[25%] h-[6%] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── CRT Monitor in center ── */}
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        {/* Table */}
        <div className="relative">
          {/* Monitor body */}
          <div
            className="w-[180px] h-[140px] rounded-[12px] flex items-center justify-center relative"
            style={{
              background:
                "linear-gradient(145deg, #d4cec4 0%, #b8b0a4 50%, #a09888 100%)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            {/* Screen */}
            <div
              className="w-[130px] h-[100px] rounded-[6px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #6aaa6a 0%, #4a8a5a 40%, #3a7a4a 100%)",
                boxShadow:
                  "inset 0 2px 8px rgba(0,0,0,0.3), 0 0 12px rgba(100,180,100,0.15)",
              }}
            >
              {/* Screen content — rolling hills */}
              <div className="relative w-full h-full">
                <div
                  className="absolute bottom-0 left-0 right-0 h-[60%]"
                  style={{
                    background:
                      "linear-gradient(180deg, #5a9a5a 0%, #4a8a4a 100%)",
                    clipPath:
                      "polygon(0% 50%, 20% 30%, 40% 45%, 60% 25%, 80% 40%, 100% 35%, 100% 100%, 0% 100%)",
                  }}
                />
              </div>
            </div>

            {/* Power light */}
            <div className="absolute bottom-3 right-6 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
          </div>

          {/* Monitor stand */}
          <div className="mx-auto w-[40px] h-[12px] bg-gradient-to-b from-[#a09888] to-[#8a8278] rounded-b-sm" />
          <div className="mx-auto w-[80px] h-[6px] bg-gradient-to-b from-[#8a8278] to-[#706860] rounded-b-md" />
        </div>

        {/* Wooden table */}
        <div
          className="-mt-1 w-[220px] h-[20px] rounded-[4px]"
          style={{
            background:
              "linear-gradient(180deg, #8B6914 0%, #704d10 50%, #5a3e0e 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        />
        {/* Table legs */}
        <div className="flex justify-between w-[200px] -mt-[1px]">
          <div className="w-[8px] h-[24px] bg-gradient-to-b from-[#5a3e0e] to-[#4a3008] rounded-b-sm" />
          <div className="w-[8px] h-[24px] bg-gradient-to-b from-[#5a3e0e] to-[#4a3008] rounded-b-sm" />
        </div>
      </div>

      {/* ── Content Overlay ── */}
      <div className="relative z-10 flex flex-col items-center h-full px-6">
        {/* Title area — top third */}
        <div className="flex flex-col items-center mt-[8vh] sm:mt-[10vh]">
          <h1
            className="text-[clamp(3rem,10vw,7rem)] font-light tracking-[0.15em] text-white leading-none select-none"
            style={{
              fontFamily: "'Times New Roman', 'Georgia', serif",
              textShadow: "0 2px 20px rgba(0,0,0,0.15)",
              letterSpacing: "0.12em",
            }}
          >
            INTER<span className="italic">S</span>TICE
          </h1>

          <p
            className="mt-4 text-white/90 text-[clamp(0.85rem,2vw,1.2rem)] font-light tracking-[0.08em]"
            style={{
              textShadow: "0 1px 8px rgba(0,0,0,0.1)",
              fontFamily: "'Georgia', serif",
            }}
          >
            Speak it. Your company handles the rest.
          </p>
        </div>

        {/* CTA — bottom area */}
        <div className="mt-auto mb-[8vh] sm:mb-[10vh] flex flex-col items-center gap-6">
          <Link
            href="/"
            className="group px-8 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium tracking-wider hover:bg-white/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Enter Dashboard
            <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>

          <p
            className="text-white/50 text-xs tracking-[0.15em] font-light"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            created by Veer Saraf &amp; Varun Kulkarni
          </p>
        </div>
      </div>
    </div>
  );
}
