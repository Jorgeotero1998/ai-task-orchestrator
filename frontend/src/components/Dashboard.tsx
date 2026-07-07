"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  FileDown,
  Loader2,
  LogOut,
  Menu,
  Rocket,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import BrandLogo from "./BrandLogo";
import { createApiClient } from "../lib/api";
import MeshBackground from "./ambient/MeshBackground";
import OrchestrationLoader from "./OrchestrationLoader";

const ParticleField = dynamic(() => import("./ambient/ParticleField"), { ssr: false });

type PlanStep = {
  step: number;
  title: string;
  description: string;
  priority: "high" | "medium" | "low" | string;
  timeline: string;
};

type HistoryItem = {
  id: string;
  title: string;
  subtasks?: unknown;
  created_at?: string;
};

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

const EXAMPLE_GOALS = [
  "Launch a tech podcast in 30 days",
  "Migrate a monolith to microservices",
  "Plan a product launch on a budget",
];

const PRODUCT_NAME = "AI Task Orchestrator";
const AXIOS_TIMEOUT_MS = 12000;

function formatPlanDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const apiBase = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (raw) return raw.replace(/\/$/, "");
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      return "/api";
    }
    return "http://localhost:8000";
  }, []);

  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const [token, setToken] = useState<string>("");
  const [task, setTask] = useState<string>("");
  const [result, setResult] = useState<PlanStep[]>([]);
  const [source, setSource] = useState<"ai" | "demo" | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [showSignIn, setShowSignIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("admin@example.com");
  const [password, setPassword] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [booting, setBooting] = useState<boolean>(true);
  const [planKey, setPlanKey] = useState<number>(0);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"guest" | "admin">("guest");
  const toastId = useRef(0);

  const pushToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const normalizePlan = useCallback((raw: unknown[]): PlanStep[] => {
    return raw.map((item, index) => {
      if (typeof item === "string") {
        return {
          step: index + 1,
          title: item.split(".")[0] || item,
          description: item,
          priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
          timeline: ["Days 1-3", "Days 4-7", "Week 2", "Week 3", "Week 4"][index] || "Week 4",
        };
      }
      const obj = item as Record<string, unknown>;
      const description = String(obj.description ?? obj.step ?? obj.title ?? "");
      const title = String(obj.title ?? description.split(".")[0] ?? `Step ${index + 1}`);
      return {
        step: Number(obj.step ?? index + 1),
        title,
        description,
        priority: String(obj.priority ?? "medium"),
        timeline: String(obj.timeline ?? obj.timeframe ?? ""),
      };
    });
  }, []);

  const fetchHistory = useCallback(
    async (authToken: string) => {
      try {
        const res = await axios.get(api.tasks, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: AXIOS_TIMEOUT_MS,
        });
        if (Array.isArray(res.data)) setHistory(res.data);
      } catch {
        pushToast("Could not load plan history", "error");
      }
    },
    [api.tasks, pushToast],
  );

  const startGuestSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await axios.post(api.authDemo, undefined, { timeout: AXIOS_TIMEOUT_MS });
      setToken(res.data.token);
      setAuthMode("guest");
      window.localStorage.setItem("token", res.data.token);
      window.localStorage.removeItem("auth_mode");
      return true;
    } catch {
      pushToast("Could not connect. Check your network and retry.", "error");
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [api.authDemo, pushToast]);

  useEffect(() => {
    document.title = PRODUCT_NAME;
    const params = new URLSearchParams(window.location.search);

    if (params.get("admin") === "1") {
      const stored = window.localStorage.getItem("token");
      if (stored) {
        setToken(stored);
        setAuthMode(window.localStorage.getItem("auth_mode") === "admin" ? "admin" : "guest");
      }
      setBooting(false);
      return;
    }

    setAuthLoading(true);
    void startGuestSession().finally(() => setBooting(false));
  }, [startGuestSession]);

  useEffect(() => {
    if (token) void fetchHistory(token);
  }, [token, fetchHistory]);

  const startSession = useCallback(
    (newToken: string, welcome: string, mode: "guest" | "admin") => {
      setToken(newToken);
      setAuthMode(mode);
      window.localStorage.setItem("token", newToken);
      pushToast(welcome, "success");
    },
    [pushToast],
  );

  const handleGuestStart = useCallback(async () => {
    const ok = await startGuestSession();
    if (ok) pushToast("You're in — start orchestrating", "success");
  }, [pushToast, startGuestSession]);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      pushToast("Enter email and password", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await axios.post(api.authLogin, { email, password }, { timeout: AXIOS_TIMEOUT_MS });
      startSession(res.data.token, "Signed in as admin", "admin");
      window.localStorage.setItem("auth_mode", "admin");
    } catch {
      pushToast("Invalid credentials", "error");
    } finally {
      setAuthLoading(false);
    }
  }, [api.authLogin, email, password, pushToast, startSession]);

  const handleLogout = useCallback(async () => {
    window.localStorage.removeItem("auth_mode");
    setResult([]);
    setHistory([]);
    setSource(null);
    setTask("");
    setActivePlanId(null);
    setAuthMode("guest");
    const ok = await startGuestSession();
    if (!ok) {
      window.localStorage.removeItem("token");
      setToken("");
    }
  }, [startGuestSession]);

  const handleOrchestrate = useCallback(
    async (goalInput?: string) => {
      const goal = (goalInput ?? task).trim();
      if (!goal) {
        pushToast("Describe a goal first", "info");
        return;
      }
      setTask(goal);
      setLoading(true);
      setResult([]);
      setSource(null);
      setExpandedSteps([]);
      setActivePlanId(null);
      try {
        const res = await axios.post(
          api.orchestrate,
          { title: goal },
          { headers: { Authorization: `Bearer ${token}` }, timeout: AXIOS_TIMEOUT_MS },
        );
        const raw = res.data?.steps ?? res.data?.subtasks ?? [];
        const steps = normalizePlan(Array.isArray(raw) ? raw : [raw]);
        setResult(steps);
        setSource(res.data?.source === "ai" ? "ai" : "demo");
        setCompletedSteps([]);
        setExpandedSteps(steps.length ? [steps[0].step] : []);
        setPlanKey((k) => k + 1);
        void fetchHistory(token);
        pushToast("Your action plan is ready", "success");
      } catch {
        pushToast("Something went wrong while generating. Try again.", "error");
      } finally {
        setLoading(false);
      }
    },
    [api.orchestrate, task, token, normalizePlan, fetchHistory, pushToast],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      try {
        await axios.delete(api.task(id), {
          headers: { Authorization: `Bearer ${token}` },
          timeout: AXIOS_TIMEOUT_MS,
        });
        setHistory((prev) => prev.filter((h) => h.id !== id));
        if (activePlanId === id) {
          setResult([]);
          setTask("");
          setSource(null);
          setActivePlanId(null);
        }
        pushToast("Plan removed", "success");
      } catch {
        pushToast("Could not delete plan", "error");
      }
    },
    [api, token, activePlanId, pushToast],
  );

  const clearHistory = useCallback(async () => {
    if (!history.length) return;
    try {
      await axios.delete(api.tasks, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: AXIOS_TIMEOUT_MS,
      });
      setHistory([]);
      setResult([]);
      setTask("");
      setSource(null);
      setActivePlanId(null);
      pushToast("History cleared", "success");
    } catch {
      pushToast("Could not clear history", "error");
    }
  }, [api.tasks, history.length, token, pushToast]);

  const loadHistory = useCallback(
    (h: HistoryItem) => {
      try {
        const data = typeof h.subtasks === "string" ? JSON.parse(h.subtasks) : h.subtasks;
        const steps = normalizePlan(Array.isArray(data) ? data : [data]);
        setResult(steps);
        setTask(h.title);
        setActivePlanId(h.id);
        setSource("demo");
        setCompletedSteps([]);
        setExpandedSteps(steps.length ? [steps[0].step] : []);
        setSidebarOpen(false);
      } catch {
        setResult([]);
      }
    },
    [normalizePlan],
  );

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const generatedAt = new Date().toLocaleString();

    doc.setFontSize(22);
    doc.setTextColor(124, 77, 255);
    doc.text(PRODUCT_NAME, 20, 22);
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text("Strategic Action Plan", 20, 30);
    doc.setFontSize(12);
    doc.text(`Goal: ${task || "Untitled"}`, 20, 42);
    doc.text(`Generated: ${generatedAt}`, 20, 49);
    doc.setDrawColor(34, 211, 238);
    doc.line(20, 54, 190, 54);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Action Plan", 20, 66);
    let y = 76;
    result.forEach((step) => {
      const header = `${step.step}. ${step.title} [${step.priority}${step.timeline ? ` · ${step.timeline}` : ""}]`;
      const body = doc.splitTextToSize(step.description, 170) as string[];
      if (y > 250) {
        doc.addPage();
        y = 24;
      }
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(doc.splitTextToSize(header, 170), 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
      doc.text(body, 24, y);
      y += body.length * 6 + 8;
    });

    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p += 1) {
      doc.setPage(p);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`${PRODUCT_NAME} · ${generatedAt} · Page ${p} of ${pages}`, 20, 290);
    }

    doc.save(`${PRODUCT_NAME.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
    pushToast("PDF exported", "success");
  }, [result, task, pushToast]);

  const progress = result.length ? Math.round((completedSteps.length / result.length) * 100) : 0;

  const countHistorySteps = useCallback((h: HistoryItem): number => {
    try {
      const data = typeof h.subtasks === "string" ? JSON.parse(h.subtasks) : h.subtasks;
      return Array.isArray(data) ? data.length : data ? 1 : 0;
    } catch {
      return 0;
    }
  }, []);

  return (
    <div className="app">
      <MeshBackground />
      <ParticleField />
      <div className="app-shell">
      <Styles />
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <AnimatePresence mode="wait">
        {booting ? (
          <motion.div key="boot" className="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="landing-card boot-card glass-panel">
              <BrandLogo size="lg" />
              <Loader2 size={32} className="spin boot-spinner" />
              <p className="hero-hint">Preparing your workspace…</p>
            </div>
          </motion.div>
        ) : !token ? (
          <motion.div
            key="landing"
            className="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="landing-card glass-panel"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <BrandLogo size="lg" />
              <h1 className="hero-title font-display">Turn any goal into a plan you can act on.</h1>
              <p className="hero-sub">
                Describe any objective and get a structured 5-step action plan — prioritized,
                trackable, exportable, and saved to your history.
              </p>

              <ul className="hero-features">
                <li>
                  <Sparkles size={15} /> AI-powered decomposition
                </li>
                <li>
                  <CheckCircle2 size={15} /> Track &amp; complete steps
                </li>
                <li>
                  <FileDown size={15} /> Export to PDF
                </li>
              </ul>

              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={handleGuestStart}
                disabled={authLoading}
              >
                {authLoading ? <Loader2 size={18} className="spin" /> : <Rocket size={18} />}
                Get started
              </button>
              <p className="hero-hint">Free guest access — no sign-up required.</p>

              <button
                type="button"
                className="link-btn"
                aria-expanded={showSignIn}
                onClick={() => setShowSignIn((s) => !s)}
              >
                {showSignIn ? "Hide sign in" : "Sign in with admin account"}
              </button>

              <AnimatePresence>
                {showSignIn && (
                  <motion.form
                    className="signin"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleLogin();
                    }}
                  >
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                      />
                    </label>
                    <label className="field">
                      <span>Password</span>
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </label>
                    <button type="submit" className="btn btn--ghost btn--block" disabled={authLoading}>
                      {authLoading ? <Loader2 size={16} className="spin" /> : null}
                      Sign in
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="app"
            className="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} aria-hidden />}
            <aside className={`sidebar glass-panel ${sidebarOpen ? "sidebar--open" : ""}`} aria-label="History">
              <div className="sidebar-head">
                <BrandLogo />
                <button
                  type="button"
                  className="icon-btn sidebar-close"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="sidebar-section-head">
                <p className="side-label">Your plans</p>
                {history.length > 0 && (
                  <button type="button" className="clear-btn" onClick={() => void clearHistory()}>
                    Clear all
                  </button>
                )}
              </div>
              <p className="session-tag">{authMode === "admin" ? "Admin session" : "Guest session"}</p>
              <div className="history-list">
                {history.length === 0 ? (
                  <p className="side-empty">No plans yet. Generate your first one above.</p>
                ) : (
                  history.map((h) => {
                    const steps = countHistorySteps(h);
                    const active = activePlanId === h.id;
                    return (
                      <div key={h.id} className={`history-row ${active ? "history-row--active" : ""}`}>
                        <button
                          type="button"
                          className="history-pill"
                          onClick={() => loadHistory(h)}
                          title={h.title}
                        >
                          <ChevronRight size={13} />
                          <span className="history-pill__meta">
                            <span className="history-pill__title">{h.title}</span>
                            {h.created_at && (
                              <span className="history-pill__date">{formatPlanDate(h.created_at)}</span>
                            )}
                          </span>
                          {steps > 0 && <span className="history-pill__count">{steps}</span>}
                        </button>
                        <button
                          type="button"
                          className="history-delete"
                          aria-label={`Delete ${h.title}`}
                          onClick={() => void deletePlan(h.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <button type="button" className="signout" onClick={() => void handleLogout()}>
                <LogOut size={15} /> {authMode === "admin" ? "Switch to guest" : "Refresh session"}
              </button>
            </aside>

            <main className="main">
              <header className="topbar glass-panel">
                <button
                  type="button"
                  className="icon-btn menu-btn"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
                <BrandLogo />
                {result.length > 0 && (
                  <button type="button" className="btn btn--soft" onClick={exportPDF}>
                    <FileDown size={15} /> PDF
                  </button>
                )}
              </header>

              <div className="canvas">
                {result.length === 0 && !loading && (
                  <motion.div
                    className="hero-panel glass-panel"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <p className="hero-panel__eyebrow font-display">Goal → Plan → Execute</p>
                    <h2 className="hero-panel__title font-display">Orchestrate your next move</h2>
                    <p className="hero-panel__sub">
                      Describe any objective — get a structured 5-step action plan with priorities and timelines.
                    </p>
                  </motion.div>
                )}

                <div className={`composer-wrap ${loading ? "composer-wrap--active" : ""}`}>
                <div className="gradient-ring">
                <div className="gradient-ring__inner composer glass-panel">
                  <label htmlFor="goal" className="composer-label font-display">
                    What do you want to achieve?
                  </label>
                  <div className={`composer-row ${loading ? "composer-row--active" : ""}`}>
                    <input
                      id="goal"
                      className="composer-input"
                      placeholder="e.g. Launch a tech podcast in 30 days"
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && handleOrchestrate()}
                    />
                    <button
                      type="button"
                      className="btn btn--primary composer-go"
                      onClick={() => handleOrchestrate()}
                      disabled={loading}
                      aria-label="Generate plan"
                    >
                      {loading ? <Loader2 size={18} className="spin" /> : <Rocket size={18} />}
                      <span className="composer-go-text">Generate</span>
                    </button>
                  </div>
                  {result.length === 0 && !loading && (
                    <div className="chips">
                      {EXAMPLE_GOALS.map((g) => (
                        <button key={g} type="button" className="chip" onClick={() => handleOrchestrate(g)}>
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                </div>
                </div>

                {result.length > 0 && !loading && (
                  <motion.div
                    className="result-head"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="result-goal font-display">{task}</h2>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="result-meta">
                      <span>
                        {completedSteps.length}/{result.length} done
                      </span>
                      {source === "demo" && <span className="badge badge--smart">Smart planning</span>}
                      {source === "ai" && <span className="badge badge--ai">AI generated</span>}
                    </div>
                  </motion.div>
                )}

                <div className="steps">
                  <AnimatePresence mode="wait">
                    {loading && task && <OrchestrationLoader key="loader" goal={task} />}
                  </AnimatePresence>

                  <AnimatePresence mode="popLayout">
                    {!loading &&
                      result.map((step, mapIndex) => {
                        const idx = step.step - 1;
                        const done = completedSteps.includes(idx);
                        const expanded = expandedSteps.includes(step.step);
                        return (
                          <motion.div
                            key={`${planKey}-${step.step}-${step.title.slice(0, 12)}`}
                            layout
                            initial={{ opacity: 0, y: 28, scale: 0.94, filter: "blur(6px)" }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{
                              delay: mapIndex * 0.11,
                              type: "spring",
                              stiffness: 280,
                              damping: 26,
                            }}
                            className={`plan-card glass-panel plan-card--${step.priority} ${done ? "plan-card--done" : ""}`}
                          >
                            <span className="plan-card__accent" aria-hidden />
                            <div className="plan-card__head">
                              <button
                                type="button"
                                className="plan-check"
                                aria-pressed={done}
                                aria-label={done ? "Mark incomplete" : "Mark complete"}
                                onClick={() =>
                                  setCompletedSteps((prev) =>
                                    prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx],
                                  )
                                }
                              >
                                {done ? (
                                  <CheckCircle2 size={20} className="step-icon step-icon--done" />
                                ) : (
                                  <Circle size={20} className="step-icon" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="plan-card__toggle"
                                aria-expanded={expanded}
                                onClick={() =>
                                  setExpandedSteps((prev) =>
                                    prev.includes(step.step)
                                      ? prev.filter((s) => s !== step.step)
                                      : [...prev, step.step],
                                  )
                                }
                              >
                                <span className="step-num">{step.step}</span>
                                <div className="plan-card__main">
                                  <div className="plan-card__title-row">
                                    <span className="plan-card__title">{step.title}</span>
                                    <span className={`prio prio--${step.priority}`}>{step.priority}</span>
                                  </div>
                                  {step.timeline && (
                                    <span className="plan-card__time">
                                      <Clock size={12} /> {step.timeline}
                                    </span>
                                  )}
                                </div>
                                <ChevronDown size={18} className={`plan-chevron ${expanded ? "plan-chevron--open" : ""}`} />
                              </button>
                            </div>
                            <AnimatePresence>
                              {expanded && (
                                <motion.p
                                  className="plan-card__body"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25 }}
                                >
                                  {step.description}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>

                  {!loading && result.length === 0 && (
                    <motion.div
                      className="empty glass-panel"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="empty-orb">
                        <Sparkles size={30} />
                      </div>
                      <p className="empty-title font-display">Ready when you are</p>
                      <p className="empty-sub">
                        Type a goal above or pick an example to see it broken into steps.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast toast--${t.type}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
          >
            <span>{t.message}</span>
            <button type="button" className="toast-x" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .app { position: relative; min-height: 100vh; width: 100%; }
      .app-shell { position: relative; z-index: 1; min-height: 100vh; }

      .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: -0.01em; font-size: 17px; }
      .brand--lg { font-size: 20px; margin-bottom: 26px; }
      .brand-mark { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px; background: var(--grad); color: #fff; box-shadow: 0 6px 18px rgba(124,77,255,0.4); }
      .grad-text { background: var(--grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

      /* Landing */
      .landing { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; z-index: 1; }
      .boot-card { text-align: center; max-width: 360px; }
      .boot-spinner { margin: 24px auto 12px; color: var(--cyan); }
      .landing-card { width: 100%; max-width: 460px; border-radius: var(--radius-lg); padding: 40px; }
      .hero-title { font-size: 34px; line-height: 1.08; font-weight: 800; margin: 4px 0 14px; letter-spacing: -0.04em; }
      .hero-sub { color: var(--text-dim); font-size: 15px; line-height: 1.6; margin: 0 0 22px; }
      .hero-features { list-style: none; padding: 0; margin: 0 0 26px; display: flex; flex-wrap: wrap; gap: 10px; }
      .hero-features li { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--text-dim); background: var(--surface-2); border: 1px solid var(--border); padding: 7px 12px; border-radius: 999px; }
      .hero-features svg { color: var(--cyan); }
      .hero-hint { text-align: center; color: var(--text-faint); font-size: 12px; margin: 12px 0 8px; }
      .link-btn { display: block; margin: 8px auto 0; background: none; border: none; color: var(--text-dim); font-size: 13px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
      .link-btn:hover { color: var(--text); }
      .signin { overflow: hidden; display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
      .field { display: flex; flex-direction: column; gap: 6px; }
      .field span { font-size: 12px; color: var(--text-dim); font-weight: 500; }
      .field input { background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 13px 14px; color: var(--text); font-size: 14px; outline: none; transition: border-color .2s, background .2s; }
      .field input:focus { border-color: var(--violet); background: var(--surface-3); }
      .api-tag { margin-top: 22px; text-align: center; color: var(--text-faint); font-size: 11px; }
      .api-tag code { color: var(--text-dim); background: var(--surface-2); padding: 2px 7px; border-radius: 6px; }

      /* Buttons */
      .btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; border: none; border-radius: 14px; padding: 13px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform .15s ease, box-shadow .2s ease, opacity .2s; }
      .btn:disabled { opacity: .6; cursor: not-allowed; }
      .btn--block { width: 100%; }
      .btn--primary { background: var(--grad); color: #fff; box-shadow: 0 10px 26px rgba(124,77,255,0.35); }
      .btn--primary:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(124,77,255,0.5); }
      .btn--ghost { background: var(--surface-2); border: 1px solid var(--border-strong); color: var(--text); }
      .btn--ghost:not(:disabled):hover { background: var(--surface-3); }
      .btn--soft { background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.3); color: var(--cyan); padding: 9px 14px; font-size: 13px; border-radius: 11px; }
      .btn--soft:hover { background: rgba(34,211,238,0.18); }
      .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 11px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); cursor: pointer; transition: background .2s; }
      .icon-btn:hover { background: var(--surface-3); }

      /* Workspace */
      .workspace { display: flex; min-height: 100vh; }
      .sidebar { width: 280px; flex-shrink: 0; border-right: 1px solid var(--border); padding: 26px 18px; display: flex; flex-direction: column; border-radius: 0; }
      .sidebar-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
      .sidebar-close { display: none; }
      .side-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-faint); font-weight: 600; margin: 0; }
      .sidebar-section-head { display: flex; align-items: center; justify-content: space-between; margin: 0 4px 8px; gap: 8px; }
      .clear-btn { background: none; border: none; color: var(--text-faint); font-size: 11px; font-weight: 600; cursor: pointer; padding: 4px 6px; border-radius: 8px; transition: color .2s, background .2s; }
      .clear-btn:hover { color: var(--red); background: rgba(251,113,133,0.08); }
      .session-tag { font-size: 11px; color: var(--text-faint); margin: 0 4px 12px; padding: 6px 10px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); width: fit-content; }
      .history-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; margin: 0 -4px; padding: 0 4px; }
      .side-empty { color: var(--text-faint); font-size: 13px; line-height: 1.5; padding: 4px; }
      .history-row { display: flex; align-items: stretch; gap: 4px; }
      .history-row--active .history-pill { background: var(--surface-2); border-color: rgba(139,92,246,0.35); color: var(--text); }
      .history-pill { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; text-align: left; padding: 11px 12px; border-radius: 12px; background: transparent; border: 1px solid transparent; color: var(--text-dim); font-size: 13px; cursor: pointer; transition: background .2s, color .2s, border-color .2s, transform .15s; }
      .history-pill__meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
      .history-pill__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .history-pill__date { font-size: 10px; color: var(--text-faint); }
      .history-pill__count { flex-shrink: 0; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 999px; background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.25); font-family: var(--font); }
      .history-pill svg { flex-shrink: 0; color: var(--violet); }
      .history-pill:hover { background: var(--surface-2); color: var(--text); border-color: var(--border); transform: translateX(3px); }
      .history-delete { display: inline-flex; align-items: center; justify-content: center; width: 36px; border-radius: 10px; background: transparent; border: 1px solid transparent; color: var(--text-faint); cursor: pointer; transition: color .2s, background .2s, border-color .2s; flex-shrink: 0; }
      .history-delete:hover { color: var(--red); background: rgba(251,113,133,0.1); border-color: rgba(251,113,133,0.25); }
      .signout { display: flex; align-items: center; gap: 9px; margin-top: 18px; padding: 12px; border-radius: 12px; background: transparent; border: 1px solid var(--border); color: var(--red); font-size: 13px; font-weight: 600; cursor: pointer; transition: background .2s; }
      .signout:hover { background: rgba(251,113,133,0.1); }

      .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .topbar { display: flex; align-items: center; gap: 14px; padding: 18px 26px; border-bottom: 1px solid var(--border); border-radius: 0; margin-bottom: 0; }
      .topbar .brand-logo { flex: 1; }
      .menu-btn { display: none; }

      .canvas { flex: 1; overflow-y: auto; padding: 30px 26px 60px; max-width: 780px; width: 100%; margin: 0 auto; }
      .hero-panel { margin-bottom: 22px; padding: 28px 26px; border-radius: var(--radius); text-align: center; }
      .hero-panel__eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--cyan); margin: 0 0 10px; font-weight: 700; }
      .hero-panel__title { font-size: 28px; font-weight: 800; margin: 0 0 10px; letter-spacing: -0.04em; line-height: 1.1; }
      .hero-panel__sub { margin: 0; font-size: 14px; color: var(--text-dim); line-height: 1.55; max-width: 420px; margin-inline: auto; }
      .composer-wrap { margin-bottom: 26px; transition: transform .25s; }
      .composer-wrap--active { transform: scale(1.008); }
      .composer { margin-bottom: 0; padding: 22px; border-radius: calc(var(--radius) - 1px); border: none; box-shadow: none; }
      .composer-label { display: block; font-size: 18px; color: var(--text); margin-bottom: 12px; font-weight: 700; letter-spacing: -0.03em; }
      .composer-row { display: flex; gap: 10px; transition: box-shadow .25s; border-radius: 14px; }
      .composer-row--active { box-shadow: 0 0 0 2px rgba(124,77,255,0.35), 0 0 30px rgba(34,211,238,0.15); }
      .composer-input { flex: 1; min-width: 0; background: var(--surface-2); border: 1px solid var(--border); border-radius: 14px; padding: 15px 16px; color: var(--text); font-size: 15px; outline: none; transition: border-color .2s, background .2s; }
      .composer-input:focus { border-color: var(--violet); background: var(--surface-3); }
      .composer-input::placeholder { color: var(--text-faint); }
      .composer-go { flex-shrink: 0; }

      .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .chip { background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim); font-size: 12.5px; padding: 8px 13px; border-radius: 999px; cursor: pointer; transition: all .2s; }
      .chip:hover { border-color: var(--violet); color: var(--text); background: var(--surface-3); }

      .result-head { margin-bottom: 18px; }
      .result-goal { font-size: 20px; font-weight: 800; margin: 0 0 14px; letter-spacing: -0.03em; line-height: 1.25; color: var(--text); }
      .progress { height: 6px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
      .progress-bar { height: 100%; background: var(--grad); border-radius: 999px; transition: width .4s ease; }
      .result-meta { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 12.5px; color: var(--text-dim); }
      .badge { font-size: 10.5px; font-weight: 700; letter-spacing: 0.03em; padding: 4px 9px; border-radius: 999px; text-transform: uppercase; }
      .badge--ai { background: rgba(52,211,153,0.14); color: var(--green); border: 1px solid rgba(52,211,153,0.3); }
      .badge--smart { background: rgba(34,211,238,0.12); color: var(--cyan); border: 1px solid rgba(34,211,238,0.28); }

      .steps { display: flex; flex-direction: column; gap: 11px; }
      .plan-card { position: relative; border-radius: 18px; overflow: hidden; transition: border-color .2s, transform .2s, box-shadow .25s; }
      .plan-card__accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 18px 0 0 18px; }
      .plan-card--high .plan-card__accent { background: linear-gradient(180deg, #fb7185, rgba(251,113,133,0.3)); }
      .plan-card--medium .plan-card__accent { background: linear-gradient(180deg, #fbbf24, rgba(251,191,36,0.3)); }
      .plan-card--low .plan-card__accent { background: linear-gradient(180deg, #34d399, rgba(52,211,153,0.3)); }
      .plan-card:hover { border-color: var(--border-strong); transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,0.35); }
      .plan-card--done { opacity: 0.58; border-color: rgba(52,211,153,0.3); }
      .plan-card--done .plan-card__title { text-decoration: line-through; }
      .plan-card__head { display: flex; align-items: stretch; gap: 8px; padding: 8px 10px 8px 8px; }
      .plan-check { display: inline-flex; align-items: center; justify-content: center; width: 42px; background: none; border: none; cursor: pointer; color: inherit; flex-shrink: 0; }
      .plan-card__toggle { flex: 1; display: flex; align-items: center; gap: 12px; background: none; border: none; color: var(--text); cursor: pointer; text-align: left; padding: 8px 6px; }
      .plan-card__main { flex: 1; min-width: 0; }
      .plan-card__title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .plan-card__title { font-size: 15px; font-weight: 700; line-height: 1.35; font-family: var(--font-display); letter-spacing: -0.02em; }
      .plan-card__time { display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; font-size: 12px; color: var(--text-dim); }
      .plan-card__body { margin: 0; padding: 0 18px 16px 68px; font-size: 13.5px; line-height: 1.6; color: var(--text-dim); }
      .plan-chevron { flex-shrink: 0; color: var(--text-faint); transition: transform .2s; }
      .plan-chevron--open { transform: rotate(180deg); color: var(--cyan); }
      .prio { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 8px; border-radius: 999px; border: 1px solid transparent; }
      .prio--high { background: rgba(251,113,133,0.12); color: #fb7185; border-color: rgba(251,113,133,0.25); }
      .prio--medium { background: rgba(251,191,36,0.12); color: #fbbf24; border-color: rgba(251,191,36,0.25); }
      .prio--low { background: rgba(52,211,153,0.12); color: var(--green); border-color: rgba(52,211,153,0.25); }
      .step-num { flex-shrink: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border-radius: 8px; background: var(--surface-3); color: var(--text-dim); }
      .step-icon { flex-shrink: 0; color: var(--violet); }
      .step-icon--done { color: var(--green); }

      .empty { text-align: center; padding: 60px 20px; border-radius: var(--radius); }

      .orch-loader { padding: 28px 24px; border-radius: var(--radius); text-align: center; margin-bottom: 8px; }
      .orch-loader__icon { width: 52px; height: 52px; margin: 0 auto 14px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: rgba(124,77,255,0.15); border: 1px solid rgba(124,77,255,0.25); }
      .orch-spark { color: var(--cyan); animation: rotate 2.5s linear infinite; }
      .orch-loader__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-faint); margin: 0 0 8px; font-weight: 700; }
      .orch-loader__goal { font-size: 17px; font-weight: 700; margin: 0 0 12px; color: var(--text); letter-spacing: -0.03em; }
      .orch-loader__status { font-size: 13px; color: var(--cyan); min-height: 20px; margin: 0 0 18px; font-family: ui-monospace, monospace; }
      .orch-cursor { animation: blink 1s step-end infinite; margin-left: 2px; }
      .orch-loader__bars { display: flex; justify-content: center; gap: 5px; height: 28px; align-items: flex-end; }
      .orch-bar { display: block; width: 5px; height: 100%; border-radius: 999px; background: var(--grad); transform-origin: bottom; }
      @keyframes blink { 50% { opacity: 0; } }

      .skeletons { display: flex; flex-direction: column; gap: 11px; }
      .skeleton { height: 58px; border-radius: 16px; background: linear-gradient(100deg, var(--surface) 30%, var(--surface-3) 50%, var(--surface) 70%); background-size: 200% 100%; animation: shimmer 1.3s infinite; }
      @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

      .empty { text-align: center; padding: 60px 20px; }
      .empty-orb { width: 74px; height: 74px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--surface-2); border: 1px solid var(--border); color: var(--violet); margin-bottom: 18px; animation: pulseOrb 3s ease-in-out infinite; }
      @keyframes pulseOrb { 0%,100% { box-shadow: 0 0 0 0 rgba(124,77,255,0.2); } 50% { box-shadow: 0 0 30px 8px rgba(124,77,255,0.15); } }
      .empty-title { font-size: 18px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.03em; }
      .empty-sub { color: var(--text-dim); font-size: 13.5px; line-height: 1.5; max-width: 340px; margin: 0 auto; }

      /* Toasts */
      .toast-stack { position: fixed; top: 20px; right: 20px; z-index: 100; display: flex; flex-direction: column; gap: 10px; max-width: calc(100vw - 40px); }
      .toast { display: flex; align-items: center; gap: 14px; background: rgba(18,18,24,0.92); backdrop-filter: blur(20px); border: 1px solid var(--border-strong); border-left-width: 3px; border-radius: 12px; padding: 13px 15px; font-size: 13.5px; box-shadow: var(--shadow); min-width: 240px; }
      .toast--success { border-left-color: var(--green); }
      .toast--error { border-left-color: var(--red); }
      .toast--info { border-left-color: var(--cyan); }
      .toast span { flex: 1; }
      .toast-x { background: none; border: none; color: var(--text-faint); cursor: pointer; display: inline-flex; padding: 2px; }
      .toast-x:hover { color: var(--text); }

      .scrim { display: none; }
      .spin { animation: rotate 1s linear infinite; }
      @keyframes rotate { to { transform: rotate(360deg); } }

      @media (max-width: 860px) {
        .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 60; transform: translateX(-100%); transition: transform .28s ease; box-shadow: var(--shadow); }
        .sidebar--open { transform: translateX(0); }
        .sidebar-close { display: inline-flex; }
        .menu-btn { display: inline-flex; }
        .scrim { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 55; }
        .canvas { padding: 22px 16px 50px; }
        .composer-go-text { display: none; }
        .composer-go { width: 52px; padding: 0; }
        .hero-title { font-size: 26px; }
        .hero-panel__title { font-size: 22px; }
        .landing-card { padding: 30px 24px; }
      }
    `}</style>
  );
}
