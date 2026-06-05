"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type GlowButtonProps = {
  variant?: "violet" | "cyan";
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export function GlowButton({
  variant = "violet",
  children,
  className = "",
  type = "button",
  disabled,
  onClick
}: GlowButtonProps) {
  return (
    <motion.button
      type={type}
      className={`glow-btn glow-btn--${variant} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
