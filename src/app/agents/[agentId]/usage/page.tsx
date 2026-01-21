"use client";

import { AgentHeader } from "@/components/AgentHeader";
import { useParams, useSearchParams } from "next/navigation";
import { useDemo } from "@/contexts/DemoContext";
import Link from "next/link";

export default function UsagePage() {
  const params = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const { approvedPatterns } = useDemo();
  
  const agentId = params?.agentId;
  const patternKey = searchParams.get("pattern");

  const pattern = patternKey && agentId
    ? approvedPatterns?.find(
        (p) => p.patternKey === patternKey && p.agentId === agentId
      )
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const usageEntries = pattern?.usage 
    ? [...pattern.usage].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10)
    : [];

  return (
    <main className="min-h-screen bg-white">
      <AgentHeader />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6">
          <Link
            href={`/agents/${agentId}/flagged`}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline mb-4 inline-block"
          >
            ← Back to Flagged Responses
          </Link>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">
            Pattern Usage
          </h2>
          <p className="text-sm text-zinc-600">
            View usage history for approved response pattern.
          </p>
        </div>

        {!pattern ? (
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
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                Pattern not found
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                The requested pattern could not be found or has no usage history.
              </p>
            </div>
          </div>
        ) : usageEntries.length === 0 ? (
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                No usage history
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                This pattern has not been reused yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="p-6 border-b bg-zinc-50">
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">
                Pattern: {pattern.patternKey}
              </h3>
              <p className="text-xs text-zinc-600">
                Approved by {pattern.approvedBy || "Unknown"} on {formatDate(pattern.approvedAt)} • 
                Total reuses: {pattern.reuseCount}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Response ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Draft Answer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {usageEntries.map((entry, index) => {
                    const truncate = (text: string | undefined, maxLength: number = 100) => {
                      if (!text) return "—";
                      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
                    };
                    
                    return (
                      <tr key={`${entry.responseId}-${index}`} className="hover:bg-zinc-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                          {formatDate(entry.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-900">
                          {entry.responseId}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 max-w-md">
                          {truncate(entry.userQuery)}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 max-w-md">
                          {truncate(entry.aiResponse)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
