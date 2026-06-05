"use client";

import Image from "next/image";
import { useState } from "react";

type UserAvatarProps = {
  name?: string;
  email?: string;
  src?: string;
  size?: number;
};

function avatarFallback(name: string, email?: string) {
  const label = encodeURIComponent(name || email || "U");
  return `https://ui-avatars.com/api/?name=${label}&background=622af3&color=fff&size=128`;
}

export function UserAvatar({ name = "U", email, src, size = 36 }: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  const photo = src ?? (email ? avatarFallback(name, email) : null);
  const [failed, setFailed] = useState(false);

  if (photo && !failed) {
    return (
      <Image
        src={photo}
        alt={name}
        width={size}
        height={size}
        className="user-avatar user-avatar--photo"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
        unoptimized
      />
    );
  }

  return (
    <span className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initial}
    </span>
  );
}
