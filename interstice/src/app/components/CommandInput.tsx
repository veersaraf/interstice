"use client";

import { useState } from "react";

export function CommandInput() {
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });
      if (res.ok) {
        setCommand("");
      }
    } catch (err) {
      console.error("Failed to send command:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Give your AI team a command..."
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        disabled={sending}
      />
      <button
        type="submit"
        disabled={!command.trim() || sending}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
