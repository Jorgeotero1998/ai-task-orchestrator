"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const STATUS_LINES = [
  "Analyzing your goal and constraints",
  "Decomposing into actionable milestones",
  "Assigning priorities and owners",
  "Estimating realistic timelines",
  "Packaging your orchestration plan",
];

type Props = {
  goal: string;
};

export default function OrchestrationLoader({ goal }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState("");

  const line = STATUS_LINES[lineIndex] ?? STATUS_LINES[0];

  useEffect(() => {
    setTyped("");
    let i = 0;
    const typeTimer = window.setInterval(() => {
      i += 1;
      setTyped(line.slice(0, i));
      if (i >= line.length) window.clearInterval(typeTimer);
    }, 22);
    return () => window.clearInterval(typeTimer);
  }, [line]);

  useEffect(() => {
    const cycle = window.setInterval(() => {
      setLineIndex((prev) => (prev + 1) % STATUS_LINES.length);
    }, 2800);
    return () => window.clearInterval(cycle);
  }, []);

  return (
    <motion.div
      className="orch-loader glass-panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <div className="orch-loader__icon">
        <Sparkles size={22} className="orch-spark" />
      </div>
      <p className="orch-loader__label">Orchestrating plan</p>
      <p className="orch-loader__goal">&ldquo;{goal}&rdquo;</p>
      <p className="orch-loader__status">
        {typed}
        <span className="orch-cursor" aria-hidden>
          |
        </span>
      </p>
      <div className="orch-loader__bars">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="orch-bar"
            animate={{ scaleY: [0.35, 1, 0.35] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
