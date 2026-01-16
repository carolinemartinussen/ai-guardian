"use client";

import { useDemo } from "@/contexts/DemoContext";

export function DemoSimulator() {
  const { cases, agents, simulateNewRequest } = useDemo();

  const openCasesCount = cases.filter((c) => c.status === "open").length;

  const handleSimulate = () => {
    if (agents.length > 0) {
      const firstAgent = agents[0];
      simulateNewRequest(firstAgent.id, `pattern-${Date.now()}`);
    }
  };

  return (
    <div className="mb-4 flex items-center gap-4 rounded-md border bg-amber-50 px-4 py-3">
      <span className="text-sm font-medium text-zinc-700">
        Open cases: {openCasesCount}
      </span>
      <button
        onClick={handleSimulate}
        className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
      >
        Simulate new request
      </button>
    </div>
  );
}
