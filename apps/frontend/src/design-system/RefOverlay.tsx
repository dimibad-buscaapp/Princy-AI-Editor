"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { SIDEBAR_WIDTH_PX } from "./princy-visual-mode";

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
    <div
      className="ref-overlay"
      aria-hidden
      style={{ paddingLeft: `${SIDEBAR_WIDTH_PX}px` }}
    >
      <Image src={src} alt="" fill style={{ objectFit: "contain", opacity: 0.5, pointerEvents: "none" }} />
    </div>
  );
}
