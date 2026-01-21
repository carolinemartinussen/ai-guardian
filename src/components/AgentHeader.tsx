"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useDemo } from "@/contexts/DemoContext";

type AgentHeaderProps = {
  itemsRequiringReview?: number;
  slaRemaining?: string;
  reviewButtonLabel?: "Review Now" | "Review Queue";
  reviewButtonDisabled?: boolean;
};

export function AgentHeader({
  itemsRequiringReview = 0,
  slaRemaining = "4h",
  reviewButtonLabel = "Review Now",
  reviewButtonDisabled = false,
}: AgentHeaderProps) {
  const params = useParams<{ agentId: string }>();
  const pathname = usePathname();
  const { agents } = useDemo();
  
  const agentId = params?.agentId;
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (!pathname) return "overview";
    if (pathname.includes("/flagged")) return "flagged";
    if (pathname.includes("/conversations")) return "conversations";
    if (pathname.includes("/guardrails")) return "guardrails";
    if (pathname.includes("/audit")) return "audit";
    return "overview";
  };

  const activeTab = getActiveTab();

  // Get monitoring status color
  const getMonitoringStatusColor = (status: string) => {
    switch (status) {
      case "monitoring":
        return "bg-amber-500";
      case "paused":
        return "bg-zinc-400";
      case "error":
        return "bg-red-500";
      default:
        return "bg-amber-500";
    }
  };

  if (!agent) {
    return (
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Agent not found
            </h1>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            The agent with ID "{agentId}" could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header: Agent name + Trust Score */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg
                className="w-5 h-5 text-zinc-700"
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
              <h1 className="text-2xl font-semibold text-zinc-900">
                {agent.name} {agent.version || "v1.0"}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 ${getMonitoringStatusColor(agent.monitoringStatus || "monitoring")} rounded-full`}></span>
              <span className="text-sm text-zinc-600 capitalize">{agent.monitoringStatus || "monitoring"}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-4xl font-semibold text-orange-600">
                {agent.trustScore}
              </span>
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"
                />
              </svg>
            </div>
            <p className="text-xs text-zinc-500">Responses monitored (last 24h)</p>
          </div>
        </div>

        {/* Alert strip */}
        {itemsRequiringReview > 0 && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/agents/${agentId}/flagged`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <span className="text-sm font-medium text-amber-900">
                  {itemsRequiringReview} items requiring review
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-zinc-600">
                  SLA: {slaRemaining} remaining
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50">
                Assign Owner
              </button>
              <button className="px-3 py-1.5 text-sm text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50">
                Export
              </button>
              {reviewButtonDisabled ? (
                <button
                  disabled
                  className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-md opacity-75 cursor-not-allowed"
                >
                  {reviewButtonLabel}
                </button>
              ) : (
                <Link
                  href={`/agents/${agentId}/flagged`}
                  className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {reviewButtonLabel}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 mb-6">
          <div className="flex items-center gap-1">
            {activeTab === "overview" ? (
              <button className="px-4 py-2 text-sm font-medium text-zinc-900 border-b-2 border-zinc-900">
                Overview
              </button>
            ) : (
              <Link
                href={`/agents/${agentId}`}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                Overview
              </Link>
            )}
            {activeTab === "flagged" ? (
              <button className="px-4 py-2 text-sm font-medium text-zinc-900 border-b-2 border-zinc-900">
                Flagged Responses
              </button>
            ) : (
              <Link
                href={`/agents/${agentId}/flagged`}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                Flagged Responses
              </Link>
            )}
            {activeTab === "conversations" ? (
              <button className="px-4 py-2 text-sm font-medium text-zinc-900 border-b-2 border-zinc-900">
                Conversations
              </button>
            ) : (
              <Link
                href={`/agents/${agentId}/conversations`}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                Conversations
              </Link>
            )}
            {activeTab === "guardrails" ? (
              <button className="px-4 py-2 text-sm font-medium text-zinc-900 border-b-2 border-zinc-900">
                Guardrails
              </button>
            ) : (
              <Link
                href={`/agents/${agentId}/guardrails`}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                Guardrails
              </Link>
            )}
            {activeTab === "audit" ? (
              <button className="px-4 py-2 text-sm font-medium text-zinc-900 border-b-2 border-zinc-900">
                Audit Log
              </button>
            ) : (
              <Link
                href={`/agents/${agentId}/audit`}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                Audit Log
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">Status Legend</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-xs text-zinc-600">Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="text-xs text-zinc-600">Needs Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-xs text-zinc-600">High Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
