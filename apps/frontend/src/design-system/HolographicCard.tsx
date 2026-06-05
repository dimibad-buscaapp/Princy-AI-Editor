"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

type HolographicCardProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
};

export function HolographicCard({ title, description, icon, href, onClick, children, className = "" }: HolographicCardProps) {
  const content = (
    <motion.div
      className={`holo-card holo-card--interactive ${className}`}
      whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(0,242,255,0.25)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {icon ? <div className="holo-card__icon">{icon}</div> : null}
      {title ? <h3 className="holo-card__title">{title}</h3> : null}
      {description ? <p className="holo-card__desc">{description}</p> : null}
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="holo-card__link">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className="holo-card__link" onClick={onClick}>
        {content}
      </button>
    );
  }

  return content;
}
