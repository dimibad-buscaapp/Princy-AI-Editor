"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type PrincyAvatarProps = {
  size?: number;
  className?: string;
};

export function PrincyAvatar({ size = 40, className = "" }: PrincyAvatarProps) {
  return (
    <motion.div
      className={`princy-avatar ${className}`}
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image
        src="/princy/avatar-alien.png"
        alt="Princy"
        width={size}
        height={size}
        className="princy-avatar__img"
        style={{ objectFit: "cover", objectPosition: "8% 12%" }}
      />
      <span className="princy-avatar__glow" aria-hidden />
    </motion.div>
  );
}
