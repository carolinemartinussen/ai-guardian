"use client";

import Link from "next/link";
import { DemoUserSwitcher } from "@/components/DemoUserSwitcher";
import { DemoSimulator } from "@/components/DemoSimulator";

export default function Home() {
  const agents = [
    {
      id: "customer-support-bot",
      name: "Customer Support Bot",
      status: "green",
      score: 92,
    },
    {
      id: "hr-policy-assistant",
      name: "HR Policy Assistant",
      status: "yellow",
      score: 78,
    },
    {
      id: "internal-dev-copilot",
      name: "Internal Dev Copilot",
      status: "red",
      score: 61,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">AI Guardian</h1>
            <p className="text-sm text-zinc-600">
              Governance & Transparency Dashboard
            </p>
          </div>

          <nav className="flex items-center gap-3">
            <a className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100" href="#">
              Fleet
            </a>
            <a className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100" href="#">
              Approvals
            </a>
            <a className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100" href="#">
              Reports
            </a>
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-3">
          <DemoUserSwitcher />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <DemoSimulator />
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Fleet Overview</h2>
          <p className="text-sm text-zinc-600">
            Monitor trust, spend, and alerts across your AI agents.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-zinc-500">Spend (Today)</p>
            <p className="mt-2 text-3xl font-semibold">kr 1,284</p>
            <p className="mt-2 text-xs text-zinc-500">+12% vs yesterday (mock)</p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-zinc-500">Active Agents</p>
            <p className="mt-2 text-3xl font-semibold">6</p>
            <p className="mt-2 text-xs text-zinc-500">1 needs attention (mock)</p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-zinc-500">Alerts (Last 24h)</p>
            <p className="mt-2 text-3xl font-semibold">3</p>
            <p className="mt-2 text-xs text-zinc-500">1 high severity (mock)</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Agents</h3>
            <span className="text-xs text-zinc-500">Traffic-light status</span>
          </div>

          <div className="space-y-3">
            {agents.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "h-3 w-3 rounded-full",
                      a.status === "green"
                        ? "bg-emerald-500"
                        : a.status === "yellow"
                        ? "bg-amber-500"
                        : "bg-red-500",
                    ].join(" ")}
                  />
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-zinc-500">
                      Trust score: {a.score}/100 (mock)
                    </p>
                  </div>
                </div>

                <Link
                  href={`/agents/${a.id}`}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  View details
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
