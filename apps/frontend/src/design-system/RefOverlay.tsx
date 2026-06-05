"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

const REF_MAP: Record<string, string> = {
  "/": "/princy/refs/03-index.png",
  "/chat": "/princy/refs/04-chat.png",
  "/swarm": "/princy/refs/06-swarm.png",
  "/observability": "/princy/refs/01-full.png",
  "/login": "/princy/refs/01-full.png"
};

export function RefOverlay() {
  const pathname = usePathname();
  const params = useSearchParams();
  if (params.get("ref") !== "1") return null;

  let src = REF_MAP[pathname];
  if (pathname.startsWith("/editor")) src = "/princy/refs/05-editor.png";

  if (!src) return null;

  return (
    <div className="ref-overlay" aria-hidden>
      <Image src={src} alt="" fill style={{ objectFit: "contain", opacity: 0.45, pointerEvents: "none" }} />
    </div>
  );
}
