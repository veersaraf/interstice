"use client";

import { useState, useEffect } from "react";

export function CompanyMemory() {
  const [memory, setMemory] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  // Poll for memory updates every 5 seconds
  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const res = await fetch("/api/memory");
        if (res.ok) {
          const data = await res.json();
          setMemory(data.content || "");
        }
      } catch {
        // ignore
      }
    };

    fetchMemory();
    const interval = setInterval(fetchMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!memory) return null;

  // Count entries (### headers)
  const entryCount = (memory.match(/^### /gm) || []).length;

  return (
    <div className="p-4 border-t border-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Company Memory
        </h2>
        <span className="text-[10px] text-gray-600">
          {entryCount} entries {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 text-[11px] text-gray-400 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono bg-gray-900/50 rounded p-2 border border-gray-800">
          {memory}
        </div>
      )}
    </div>
  );
}
