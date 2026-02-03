import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogOut, Circle, Loader2, ShieldCheck, Zap, History, Rocket, ChevronRight, CheckCircle2, FileDown } from 'lucide-react';
import { jsPDF } from "jspdf";

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [task, setTask] = useState('');
    const [result, setResult] = useState([]); 
    const [history, setHistory] = useState([]);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { 
        document.title = "AI-BIO | Neural Orchestrator"; 
        if (token) fetchHistory();
    }, [token]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:3001/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && Array.isArray(res.data)) setHistory(res.data);
        } catch (e) { console.error("History sync error"); }
    };

    const handleLogin = async (email, password) => {
        try {
            const res = await axios.post('http://127.0.0.1:3001/auth/login', { email, password });
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
        } catch (err) { alert("Acceso denegado: Credenciales no válidas"); }
    };

    const parseStep = (item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
            return item.descripcion || item.paso || JSON.stringify(item);
        }
        return "Procesando dato...";
    };

    const exportarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(112, 0, 255);
        doc.text("Plan de Orquestación AI-BIO", 20, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Objetivo: ${task || "Consulta de Historial"}`, 20, 35);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 42);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 242, 255);
        doc.line(20, 48, 190, 48);

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Protocolo Detallado:", 20, 60);

        let yPos = 70;
        result.forEach((step, index) => {
            const text = `${index + 1}. ${parseStep(step)}`;
            const lines = doc.splitTextToSize(text, 170);
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setFontSize(11);
            doc.text(lines, 20, yPos);
            yPos += (lines.length * 7);
        });

        doc.save(`BIO_Protocol_${Date.now()}.pdf`);
    };

    const handleOrchestrate = async () => {
        if (!task) return;
        setLoading(true);
        try {
            const res = await axios.post('http://127.0.0.1:3001/api/orchestrate', 
                { title: task }, { headers: { Authorization: `Bearer ${token}` } }
            );
            const rawData = res.data?.subtasks || [];
            setResult(Array.isArray(rawData) ? rawData : [rawData]);
            setCompletedSteps([]);
            fetchHistory();
        } catch (e) { alert("Error de enlace neural con el servidor"); }
        finally { setLoading(false); }
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
                body, html { width: 100%; height: 100%; background: #050505; color: white; overflow: hidden; }
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
                    <motion.div key="auth" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="main-content">
                        <div className="glass-card" style={{textAlign:'center', maxWidth:400}}>
                            <ShieldCheck size={50} color="#7000ff" style={{margin:'0 auto 20px'}} />
                            <div className="brand" style={{justifyContent:'center'}}>AI-<span className="neon">BIO</span></div>
                            <p style={{fontSize:10, opacity:0.3, letterSpacing:4, margin:'10px 0 40px'}}>PROTOCOL DE ACCESO</p>
                            <input id="email" placeholder="USUARIO" style={{width:'100%', padding:18, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, color:'white', marginBottom:15, outline:'none'}} />
                            <input id="pass" type="password" placeholder="TOKEN" style={{width:'100%', padding:18, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, color:'white', marginBottom:30, outline:'none'}} />
                            <button onClick={() => handleLogin(document.getElementById('email').value, document.getElementById('pass').value)} style={{width:'100%', padding:20, background: 'linear-gradient(135deg, #7000ff, #00f2ff)', color:'white', border:'none', borderRadius:16, fontWeight:900, cursor:'pointer', letterSpacing:2}}>INICIAR SESIÓN</button>
                        </div>
                    </motion.div>
                ) : (
                    <div style={{display:'flex', width:'100%'}}>
                        <aside className="sidebar">
                            <div className="brand" style={{marginBottom:40}}><Zap size={22} color="#00f2ff" fill="#00f2ff" />AI-<span className="neon">BIO</span></div>
                            <div style={{flex:1, overflowY:'auto', paddingRight:5}}>
                                <p style={{fontSize:9, opacity:0.3, letterSpacing:2, marginBottom:20, fontWeight:700}}>HISTORIAL NEURAL</p>
                                {history.map(h => (
                                    <div key={h.id} className="history-pill" onClick={() => {
                                        try {
                                            const data = typeof h.subtasks === 'string' ? JSON.parse(h.subtasks) : h.subtasks;
                                            setResult(Array.isArray(data) ? data : [data]);
                                            setTask(h.title);
                                            setCompletedSteps([]);
                                        } catch(e) { setResult([]); }
                                    }}>
                                        <ChevronRight size={12} style={{marginRight:8}}/> {h.title}
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{background:'none', border:'none', color:'rgba(255,68,68,0.6)', cursor:'pointer', fontSize:11, marginTop:20, textAlign:'left', fontWeight:700}}><LogOut size={14} style={{marginRight:8, verticalAlign:'middle'}}/> DESCONECTAR</button>
                        </aside>

                        <main className="main-content">
                            <div className={`glass-card ${loading ? 'pulse-loading' : ''}`}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div className="brand">BIO-<span className="neon">ORQUESTADOR</span></div>
                                    {result.length > 0 && (
                                        <button className="btn-pdf" onClick={exportarPDF}>
                                            <FileDown size={14} /> PDF
                                        </button>
                                    )}
                                </div>
                                <div className="input-container">
                                    <input placeholder="Defina el objetivo estratégico..." value={task} onChange={e => setTask(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleOrchestrate()}/>
                                    <button className="btn-action" onClick={handleOrchestrate}>
                                        {loading ? <Loader2 className="spin" size={20}/> : <Rocket size={20} />}
                                    </button>
                                </div>
                                <div className="results-area" style={{marginTop:30, overflowY:'auto', flex:1}}>
                                    <AnimatePresence>
                                        {result.map((step, i) => (
                                            <motion.div 
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`step-card ${completedSteps.includes(i) ? 'completed' : ''}`}
                                                onClick={() => setCompletedSteps(prev => prev.includes(i) ? prev.filter(x => x!==i) : [...prev, i])}
                                            >
                                                {completedSteps.includes(i) ? <CheckCircle2 size={18} color="#00ff88" /> : <Circle size={18} color="#7000ff" opacity={0.5} />}
                                                <p style={{fontSize:14, lineHeight:1.5, paddingTop:2}}>{parseStep(step)}</p>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {!loading && result.length === 0 && (
                                        <div style={{textAlign:'center', marginTop:50, opacity:0.15}}>
                                            <Sparkles size={40} style={{marginBottom:15}} />
                                            <p style={{fontSize:12, letterSpacing:2}}>SISTEMA LISTO PARA ÓRDENES</p>
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

export default App;