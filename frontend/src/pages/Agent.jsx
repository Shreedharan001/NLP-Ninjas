import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bot, Send, Sparkles, Terminal, Wrench, ArrowRight, ShieldCheck,
  CheckCircle2, DollarSign, Activity, Zap, Play, Settings2, RefreshCw, AlertOctagon
} from 'lucide-react';
import { api } from '../services/api';

export default function Agent() {
  const [searchParams] = useSearchParams();
  const initialSite = searchParams.get('site');
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: initialSite 
        ? `Hello! I am ready to evaluate **${initialSite}**. Would you like me to analyze its performance ratio degradation, check behavioral fault signatures, or calculate cleaning payback?`
        : `Hello! I am the **Solar Portfolio Autonomous Maintenance Agent**.\n\nAutonomous control mode is **ENABLED**. I continuously monitor telemetry, evaluate physical baseline shortfalls, quantify economic losses, and prioritize or auto-dispatch maintenance work orders based on financial return.\n\nHow can I assist you or which site should I evaluate?`,
      reasoning_steps: [],
      tools_executed: []
    }
  ]);
  const [input, setInput] = useState(initialSite ? `Analyze ${initialSite} for maintenance ROI` : '');
  const [loading, setLoading] = useState(false);
  const [isAutoControlActive, setIsAutoControlActive] = useState(true);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [paybackThreshold, setPaybackThreshold] = useState(5.0);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "⚡ Auto-Dispatch High ROI Work Orders",
    "Which site should we inspect first?",
    "Analyze SITE-001 (Rooftop Chennai) cleaning payback",
    "Inspect Inverter Fault on SITE-002 (Thar Solar)",
    "What is the total financial loss across portfolio?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await api.chatWithAgent(query, initialSite);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: resp.reply,
        reasoning_steps: resp.reasoning_steps || [],
        tools_executed: resp.tools_executed || [],
        suggested_actions: resp.suggested_actions || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error communicating with AI Agent backend: ${err.message}`,
        reasoning_steps: [],
        tools_executed: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAutoDispatch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_payback_days: paybackThreshold })
      });
      const data = await res.json();
      setDispatchResult(data);

      const agentReply = {
        role: 'assistant',
        content: `### ⚡ Autonomous Control Execution Complete\n\nScanned portfolio with payback threshold **≤ ${paybackThreshold} days**.\n\n**Dispatched ${data.dispatched_count} Work Orders**:\n` +
          data.dispatched_tickets.map(t => `- **${t.ticket_id}**: ${t.site_name} (${t.fault_type} | Daily Loss: ₹${t.daily_loss.toLocaleString()}/d | Payback: ${t.payback_days}d)`).join('\n') +
          `\n\nAll tickets are now visible in the **Maintenance Hub** with assigned technician crews.`,
        reasoning_steps: data.reasoning_steps || [],
        tools_executed: ["get_portfolio_data", "calculate_payback", "create_maintenance_ticket"],
        suggested_actions: ["View Maintenance Hub", "Inspect Thar Solar Block 4", "Review Telemetry Curves"]
      };

      setMessages(prev => [...prev, agentReply]);
    } catch (err) {
      alert('Autonomous dispatch error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 max-w-[1500px] mx-auto w-full flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Banner with Autonomous Control Status */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-slate-100">Solar Maintenance AI Agent</h1>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Autonomous Control Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Deterministic tool calling • Real-time priority ranking • Auto-work order dispatch</p>
          </div>
        </div>

        {/* Autonomous Control Quick Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Max Payback Filter:</span>
            <select
              value={paybackThreshold}
              onChange={(e) => setPaybackThreshold(parseFloat(e.target.value))}
              className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="3.0" className="bg-slate-900 text-slate-200">≤ 3.0 Days (High ROI)</option>
              <option value="5.0" className="bg-slate-900 text-slate-200">≤ 5.0 Days (Standard)</option>
              <option value="10.0" className="bg-slate-900 text-slate-200">≤ 10.0 Days (All viable)</option>
            </select>
          </div>

          <button
            onClick={handleTriggerAutoDispatch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-slate-950 fill-current" /> Execute Autonomous Dispatch
          </button>
        </div>
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 bg-[#090d16] border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold shadow-md'
                  : 'bg-[#0f172a] border border-slate-700/80 text-slate-200 shadow-xl'
              }`}
            >
              {/* If Assistant, render reasoning trace if present */}
              {m.role === 'assistant' && m.reasoning_steps?.length > 0 && (
                <div className="mb-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-400">
                    <Terminal className="w-3.5 h-3.5" /> Autonomous Tool Reasoning Trace
                  </div>
                  <div className="space-y-1.5">
                    {m.reasoning_steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2 text-[11px]">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                          step.phase === 'OBSERVE' ? 'bg-blue-500/20 text-blue-300' :
                          step.phase === 'ANALYZE' ? 'bg-purple-500/20 text-purple-300' :
                          step.phase === 'CALCULATE' ? 'bg-amber-500/20 text-amber-300' :
                          step.phase === 'ACT' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {step.phase}
                        </span>
                        <span className="text-slate-300">{step.thought}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Content Formatted */}
              <div className="whitespace-pre-wrap font-sans space-y-2">
                {m.content}
              </div>

              {/* Tools Badges */}
              {m.tools_executed?.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">Executed Tools:</span>
                  {m.tools_executed.map((tool, tIdx) => (
                    <span key={tIdx} className="bg-slate-900 border border-slate-700 text-cyan-400 font-mono px-1.5 py-0.5 rounded">
                      ⚙ {tool}()
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested Followups */}
            {m.suggested_actions?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.suggested_actions.map((act, aIdx) => (
                  <button
                    key={aIdx}
                    onClick={() => {
                      if (act.includes("Maintenance Hub")) {
                        window.location.href = "/tickets";
                      } else {
                        handleSend(act);
                      }
                    }}
                    className="text-[11px] bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    💡 {act}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-xs text-cyan-400 w-fit">
            <Bot className="w-4 h-4 animate-bounce" />
            <span>Agent executing physical telemetry models & calculating payback...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0 text-xs">
        <span className="text-slate-500 text-[11px] shrink-0 font-medium">Try:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="whitespace-nowrap px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer text-[11px]"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="relative shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI Agent or issue control commands (e.g. 'Auto dispatch maintenance', 'Which site should we inspect first?')..."
          className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl pl-4 pr-24 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-xl"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="absolute right-2 top-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </div>
    </div>
  );
}
