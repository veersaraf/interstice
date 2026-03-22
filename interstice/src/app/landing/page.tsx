"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
      {/* Google Font — Nanum Myeongjo (elegant serif like interludeapp.net) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
        style={{ fontFamily: "'Nanum Myeongjo', 'Georgia', serif" }}
      >
        {/* ── Hero Section ── */}
        <section className="flex flex-col items-center text-center max-w-2xl mx-auto mb-32">
          <p className="text-[11px] tracking-[0.3em] text-stone-400 uppercase mb-10">
            AI Agent Orchestration
          </p>

          <h1
            className="text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold text-stone-900 leading-[0.95] tracking-tight mb-8"
          >
            Interstice
          </h1>

          <p className="text-[clamp(1rem,2.5vw,1.35rem)] text-stone-500 leading-relaxed font-normal max-w-md">
            Speak it.
            <br />
            Your company handles the rest.
          </p>
        </section>

        {/* ── What It Does ── */}
        <section className="flex flex-col items-center text-center max-w-lg mx-auto mb-28">
          <p className="text-[13px] text-stone-800 font-bold tracking-wide uppercase mb-6">
            The Gap Between Intent and Execution
          </p>

          <p className="text-[15px] text-stone-500 leading-[1.9]">
            You speak a command into your wearable.
            Your AI CEO hears it, breaks it into tasks,
            and delegates to a team of specialist agents.
            They research, write, build, and call &mdash;
            collaborating in real time.
            You watch it happen.
          </p>
        </section>

        {/* ── How It Works — Three Steps ── */}
        <section className="flex flex-col items-center text-center max-w-sm mx-auto mb-28">
          <div className="space-y-10">
            <div>
              <p className="text-[28px] font-bold text-stone-900 mb-2">
                Speak
              </p>
              <p className="text-[13px] text-stone-400 leading-relaxed">
                Tell your CEO what you need. Research a market.
                Draft an email. Build a landing page. Make a call.
              </p>
            </div>

            <div className="w-px h-8 bg-stone-200 mx-auto" />

            <div>
              <p className="text-[28px] font-bold text-stone-900 mb-2">
                Delegate
              </p>
              <p className="text-[13px] text-stone-400 leading-relaxed">
                Your CEO decomposes the task, assigns it to specialists,
                and they execute in parallel &mdash; talking to each other as they work.
              </p>
            </div>

            <div className="w-px h-8 bg-stone-200 mx-auto" />

            <div>
              <p className="text-[28px] font-bold text-stone-900 mb-2">
                Done
              </p>
              <p className="text-[13px] text-stone-400 leading-relaxed">
                Results synthesized. Reports written.
                Emails drafted. Calls made.
                Your wrist buzzes with the summary.
              </p>
            </div>
          </div>
        </section>

        {/* ── The Team ── */}
        <section className="flex flex-col items-center text-center max-w-md mx-auto mb-28">
          <p className="text-[11px] tracking-[0.3em] text-stone-400 uppercase mb-8">
            Your AI Company
          </p>

          <div className="space-y-4">
            {[
              ["CEO", "Delegates, monitors, synthesizes"],
              ["Research", "Web search, competitive analysis"],
              ["Communications", "Email drafts, outreach"],
              ["Developer", "Code generation, landing pages"],
              ["Call Agent", "Real phone calls via ElevenLabs"],
            ].map(([role, desc]) => (
              <div key={role}>
                <p className="text-[16px] font-bold text-stone-800">{role}</p>
                <p className="text-[12px] text-stone-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="flex flex-col items-center text-center max-w-md mx-auto mb-16">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-bold tracking-wide text-stone-900 border border-stone-900 rounded-none hover:bg-stone-900 hover:text-white transition-all duration-300"
            style={{ fontFamily: "'Nanum Myeongjo', 'Georgia', serif" }}
          >
            Open Dashboard
            <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer className="flex flex-col items-center text-center mt-auto pt-12 pb-8 border-t border-stone-100 w-full max-w-sm mx-auto">
          <p className="text-[11px] text-stone-400 tracking-wide">
            Built at HackHayward 2026
          </p>
          <p className="text-[11px] text-stone-300 mt-1">
            Veer Saraf &amp; Varun Kulkarni
          </p>
        </footer>
      </div>
    </div>
  );
}
