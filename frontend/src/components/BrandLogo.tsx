"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type Props = {
  size?: "sm" | "lg";
};

export default function BrandLogo({ size = "sm" }: Props) {
  const large = size === "lg";

  return (
    <div className={`brand-logo ${large ? "brand-logo--lg" : ""}`}>
      <motion.span
        className="brand-logo__orb"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        <Sparkles size={large ? 18 : 14} />
      </motion.span>
      <span className="brand-logo__text">
        <span className="brand-logo__line">AI Task</span>
        <span className="brand-logo__accent">Orchestrator</span>
      </span>
    </div>
  );
}
