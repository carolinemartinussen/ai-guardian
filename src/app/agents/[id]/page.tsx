"use client";

import { useParams } from "next/navigation";

export default function AgentPage() {
  const params = useParams<{ id?: string }>();
  const agentId = params?.id ?? "unknown-agent";

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <h1 className="text-xl font-semibold capitalize">
        Agent: {agentId.replace(/-/g, " ")}
      </h1>

      <p className="mt-2 text-sm text-zinc-600">
        Trust & hallucination deep-dive (mock)
      </p>

      <div className="mt-6 rounded-xl border bg-white p-4">
        <p className="text-sm text-zinc-500">Example flagged response</p>

        <p className="mt-2 text-sm">
          “According to policy, employees are entitled to 35 vacation days…”
        </p>

        <p className="mt-2 text-xs text-red-600">
          ⚠ Low confidence – missing source
        </p>
      </div>
    </main>
  );
}
