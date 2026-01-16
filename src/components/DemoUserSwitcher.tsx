"use client";

import { useDemo } from "@/contexts/DemoContext";
import { DEMO_USERS } from "@/types/demo";

export function DemoUserSwitcher() {
  const { currentUser, switchUser } = useDemo();

  return (
    <div className="flex items-center gap-3 rounded-md border bg-white px-4 py-2">
      <span className="text-sm text-zinc-600">
        Signed in as: <span className="font-medium">{currentUser.name}</span> (
        {currentUser.role})
      </span>
      <select
        value={currentUser.id}
        onChange={(e) => switchUser(e.target.value)}
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {DEMO_USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} - {user.role}
          </option>
        ))}
      </select>
    </div>
  );
}
