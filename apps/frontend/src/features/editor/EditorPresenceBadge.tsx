"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";

type PresenceUser = {
  userId: string;
  userName: string;
  filePath?: string;
  lastSeen: string;
};

export function EditorPresenceBadge({ workspaceId, filePath }: { workspaceId: string; filePath?: string }) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        await apiFetch("/workspace/presence", {
          method: "POST",
          body: { workspaceId, filePath }
        });
        const data = await apiFetch<{ users: PresenceUser[] }>(`/workspace/presence?workspaceId=${encodeURIComponent(workspaceId)}`);
        if (active) setUsers(data.users ?? []);
      } catch {
        if (active) setUsers([]);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 15_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [workspaceId, filePath]);

  if (users.length === 0) return null;

  return (
    <div className="editor-presence-badge" title={users.map((u) => u.userName).join(", ")}>
      <Users size={14} />
      <span>{users.length}</span>
      <ul className="editor-presence-badge__list">
        {users.map((u) => (
          <li key={u.userId}>
            <span className="editor-presence-badge__dot" />
            {u.userName}
            {u.filePath ? <em>{u.filePath.split("/").pop()}</em> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
