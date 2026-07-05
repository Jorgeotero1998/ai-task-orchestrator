"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  FileDown,
  Loader2,
  LogOut,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { jsPDF } from "jspdf";

type HistoryItem = {
  id: string;
  title: string;
  subtasks?: unknown;
  created_at?: string;
};

export default function Dashboard() {
  const apiBase = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (raw) return raw.replace(/\/$/, "");
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      return "/api";
    }
    return "http://localhost:8000";
  }, []);

  const [token, setToken] = useState<string>("");
  const [task, setTask] = useState<string>("");
  const [result, setResult] = useState<unknown[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    document.title = "AI Task Orchestrator";
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (token) void fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) setHistory(res.data);
    } catch {
      // ignore
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${apiBase}/auth/login`, { email, password });
      setToken(res.data.token);
      window.localStorage.setItem("token", res.data.token);
    } catch {
      alert("Access denied: invalid credentials");
    }
  };

  const parseStep = (item: unknown) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      const anyItem = item as Record<string, unknown>;
      const v = anyItem.descripcion ?? anyItem.paso ?? anyItem.step ?? anyItem.title;
      if (typeof v === "string") return v;
      return JSON.stringify(item);
    }
    return "Processing...";
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(112, 0, 255);
    doc.text("AI Task Orchestrator", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Goal: ${task || "History item"}`, 20, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 242, 255);
    doc.line(20, 48, 190, 48);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Steps:", 20, 60);

    let yPos = 70;
    result.forEach((step, index) => {
      const text = `${index + 1}. ${parseStep(step)}`;
      const lines = doc.splitTextToSize(text, 170);
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.text(lines, 20, yPos);
      yPos += lines.length * 7;
    });

    doc.save(`AI_Task_Orchestrator_${Date.now()}.pdf`);
  };

  const handleOrchestrate = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${apiBase}/api/orchestrate`,
        { title: task },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const rawData = res.data?.subtasks ?? res.data?.steps ?? (Array.isArray(res.data) ? res.data : [res.data]);
      setResult(Array.isArray(rawData) ? rawData : [rawData]);
      setCompletedSteps([]);
      void fetchHistory();
    } catch {
      alert("Server error while orchestrating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Roboto', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 242, 255, 0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #00f2ff; }
        .app-root {
          width: 100vw; height: 100vh; display: flex;
          background: #050505;
          background-image:
            radial-gradient(at 0% 0%, rgba(112, 0, 255, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(0, 242, 255, 0.15) 0px, transparent 50%);
        }
        .sidebar {
          width: 280px; background: rgba(255,255,255,0.01);
          backdrop-filter: blur(40px); border-right: 1px solid rgba(255,255,255,0.05);
          padding: 40px 20px; display: flex; flex-direction: column;
        }
        .main-content { flex: 1; display: flex; justify-content: center; align-items: center; padding: 40px; }
        .glass-card {
          background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(60px);
          border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 40px;
          padding: 45px; width: 100%; max-width: 550px; max-height: 85vh;
          display: flex; flex-direction: column;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
          transition: all 0.5s ease;
        }
        .pulse-loading {
          animation: pulse 2s infinite;
          border-color: rgba(0, 242, 255, 0.3);
          box-shadow: 0 0 40px rgba(112, 0, 255, 0.2);
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 900; font-size: 22px; letter-spacing: 4px; }
        .neon { color: #00f2ff; text-shadow: 0 0 15px rgba(0, 242, 255, 0.6); }
        .input-container {
          display: flex; background: rgba(255,255,255,0.04); border-radius: 20px;
          padding: 8px; border: 1px solid rgba(255,255,255,0.08); margin-top: 30px;
          transition: 0.3s;
        }
        .input-container:focus-within { border-color: #7000ff; background: rgba(255,255,255,0.07); }
        .input-container input {
          background: none; border: none; color: white; flex: 1; padding: 15px; outline: none; font-size: 16px;
        }
        .btn-action {
          background: linear-gradient(135deg, #7000ff, #00f2ff); color: white;
          border: none; border-radius: 16px; width: 52px; height: 52px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: 0.3s;
        }
        .btn-action:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(112, 0, 255, 0.4); }
        .history-pill {
          padding: 12px 16px; border-radius: 14px; background: rgba(255,255,255,0.02);
          margin-bottom: 8px; cursor: pointer; font-size: 13px; color: rgba(255,255,255,0.4);
          transition: 0.3s; border: 1px solid transparent; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .history-pill:hover { background: rgba(255,255,255,0.06); color: #00f2ff; padding-left: 20px; }
        .step-card {
          display: flex; align-items: flex-start; gap: 15px; padding: 18px;
          background: rgba(255,255,255,0.02); border-radius: 20px;
          margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.04);
          cursor: pointer; transition: 0.4s;
        }
        .step-card:hover { background: rgba(255,255,255,0.05); transform: translateX(5px); }
        .step-card.completed { border-color: #00ff88; opacity: 0.5; }
        .step-card.completed p { text-decoration: line-through; }
        .btn-pdf {
          background: rgba(0, 242, 255, 0.1); color: #00f2ff; border: 1px solid rgba(0, 242, 255, 0.3);
          padding: 8px 15px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; gap: 8px; margin-top: 15px; transition: 0.3s;
        }
        .btn-pdf:hover { background: #00f2ff; color: black; }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <AnimatePresence mode="wait">
        {!token ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="main-content"
          >
            <div className="glass-card" style={{ textAlign: "center", maxWidth: 420 }}>
              <ShieldCheck size={50} color="#7000ff" style={{ margin: "0 auto 20px" }} />
              <div className="brand" style={{ justifyContent: "center" }}>
                AI-<span className="neon">TASK</span>
              </div>
              <p style={{ fontSize: 10, opacity: 0.3, letterSpacing: 4, margin: "10px 0 40px" }}>
                ADMIN ACCESS
              </p>
              <input
                id="email"
                placeholder="EMAIL"
                style={{
                  width: "100%",
                  padding: 18,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  color: "white",
                  marginBottom: 15,
                  outline: "none",
                }}
              />
              <input
                id="pass"
                type="password"
                placeholder="PASSWORD"
                style={{
                  width: "100%",
                  padding: 18,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  color: "white",
                  marginBottom: 30,
                  outline: "none",
                }}
              />
              <button
                onClick={() =>
                  handleLogin(
                    (document.getElementById("email") as HTMLInputElement)?.value || "",
                    (document.getElementById("pass") as HTMLInputElement)?.value || "",
                  )
                }
                style={{
                  width: "100%",
                  padding: 20,
                  background: "linear-gradient(135deg, #7000ff, #00f2ff)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  fontWeight: 900,
                  cursor: "pointer",
                  letterSpacing: 2,
                }}
              >
                SIGN IN
              </button>
              <p style={{ marginTop: 18, fontSize: 11, opacity: 0.35 }}>
                API: <span style={{ opacity: 0.8 }}>{apiBase}</span>
              </p>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", width: "100%" }}>
            <aside className="sidebar">
              <div className="brand" style={{ marginBottom: 40 }}>
                <Zap size={22} color="#00f2ff" fill="#00f2ff" />
                AI-<span className="neon">TASK</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", paddingRight: 5 }}>
                <p style={{ fontSize: 9, opacity: 0.3, letterSpacing: 2, marginBottom: 20, fontWeight: 700 }}>
                  HISTORY
                </p>
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="history-pill"
                    onClick={() => {
                      try {
                        const data =
                          typeof h.subtasks === "string" ? JSON.parse(h.subtasks) : (h.subtasks as unknown);
                        setResult(Array.isArray(data) ? data : [data]);
                        setTask(h.title);
                        setCompletedSteps([]);
                      } catch {
                        setResult([]);
                      }
                    }}
                    title={h.title}
                  >
                    <ChevronRight size={12} style={{ marginRight: 8 }} /> {h.title}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  window.localStorage.removeItem("token");
                  window.location.reload();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,68,68,0.75)",
                  cursor: "pointer",
                  fontSize: 11,
                  marginTop: 20,
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                <LogOut size={14} style={{ marginRight: 8, verticalAlign: "middle" }} /> SIGN OUT
              </button>
            </aside>

            <main className="main-content">
              <div className={`glass-card ${loading ? "pulse-loading" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="brand">
                    ORCHESTRATOR<span className="neon">DASH</span>
                  </div>
                  {result.length > 0 && (
                    <button className="btn-pdf" onClick={exportPDF}>
                      <FileDown size={14} /> PDF
                    </button>
                  )}
                </div>
                <div className="input-container">
                  <input
                    placeholder="Define the strategic goal..."
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleOrchestrate()}
                  />
                  <button className="btn-action" onClick={handleOrchestrate} aria-label="Orchestrate">
                    {loading ? <Loader2 className="spin" size={20} /> : <Rocket size={20} />}
                  </button>
                </div>

                <div className="results-area" style={{ marginTop: 30, overflowY: "auto", flex: 1 }}>
                  <AnimatePresence>
                    {result.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`step-card ${completedSteps.includes(i) ? "completed" : ""}`}
                        onClick={() =>
                          setCompletedSteps((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
                        }
                      >
                        {completedSteps.includes(i) ? (
                          <CheckCircle2 size={18} color="#00ff88" />
                        ) : (
                          <Circle size={18} color="#7000ff" opacity={0.5} />
                        )}
                        <p style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 2 }}>{parseStep(step)}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {!loading && result.length === 0 && (
                    <div style={{ textAlign: "center", marginTop: 50, opacity: 0.15 }}>
                      <Sparkles size={40} style={{ marginBottom: 15 }} />
                      <p style={{ fontSize: 12, letterSpacing: 2 }}>READY FOR COMMANDS</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

