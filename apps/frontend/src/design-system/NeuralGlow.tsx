"use client";

import { motion } from "framer-motion";

type NeuralGlowProps = {
  size?: number;
  className?: string;
};

export function NeuralGlow({ size = 320, className = "" }: NeuralGlowProps) {
  return (
    <motion.div
      className={`neural-glow ${className}`}
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    />
  );
}
