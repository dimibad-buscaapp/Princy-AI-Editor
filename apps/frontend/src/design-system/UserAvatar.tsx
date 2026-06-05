"use client";

type UserAvatarProps = {
  name?: string;
  size?: number;
};

export function UserAvatar({ name = "U", size = 36 }: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  return (
    <span className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initial}
    </span>
  );
}
