"use client";

import { AgentHeader } from "@/components/AgentHeader";

export default function GuardrailsPage() {
  return (
    <main className="min-h-screen bg-white">
      <AgentHeader />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">
            Guardrails
          </h2>
          <p className="text-sm text-zinc-600">
            Configure and monitor guardrails for this agent.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">
              Guardrails configuration
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Configure PII detection, content filters, and compliance rules for this agent.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
