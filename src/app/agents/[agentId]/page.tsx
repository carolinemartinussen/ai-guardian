"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useDemo } from "@/contexts/DemoContext";

export default function AgentPage() {
  const params = useParams<{ agentId: string }>();
  const { agents } = useDemo();
  
  const agentId = params?.agentId;
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "text-emerald-600";
      case "yellow":
        return "text-amber-600";
      case "red":
        return "text-red-600";
      default:
        return "text-zinc-600";
    }
  };

  if (!agentId || !agent) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold">Agent not found</h1>
          <p className="mt-1 text-sm text-zinc-600">
            The agent with ID "{agentId}" could not be found.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{agent.name}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Status: <span className={getStatusColor(agent.status)}>{agent.status}</span> • Trust Score: {agent.trustScore}/100
            </p>
          </div>

          <Link
            href={`/agents/${agentId}/flagged`}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            View flagged responses
          </Link>
        </div>

        <div className="mt-6 rounded-xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Quick status</p>
          <p className="mt-2 text-sm text-zinc-700">
            This is a simple agent overview page. Next step is to add tabs (Overview,
            Flagged, Conversations, Guardrails, Audit Log) like in Figma.
          </p>
        </div>
      </div>
    </main>
  );
}

