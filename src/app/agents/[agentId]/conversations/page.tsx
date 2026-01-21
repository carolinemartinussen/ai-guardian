"use client";

import { AgentHeader } from "@/components/AgentHeader";

export default function ConversationsPage() {
  return (
    <main className="min-h-screen bg-white">
      <AgentHeader />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">
            Conversations
          </h2>
          <p className="text-sm text-zinc-600">
            View and analyze conversation history with this agent.
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
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-5.26.402A2.115 2.115 0 003 5.222v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-5.26.402A2.115 2.115 0 003 5.222v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-5.26.402A2.115 2.115 0 003 5.222v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-5.26.402A2.115 2.115 0 003 5.222v4.286c0 .837.46 1.58 1.155 1.951"
              />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">
              No conversations yet
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Conversation history will appear here once the agent starts receiving requests.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
