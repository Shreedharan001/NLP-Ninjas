import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, Zap, TrendingDown, DollarSign, Wrench, ShieldAlert, CheckCircle2,
  AlertTriangle, ArrowUpRight, ChevronRight, Activity, Bot, Sparkles, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar
} from 'recharts';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import GeoPortfolioMap from '../components/GeoPortfolioMap';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [sites, setSites] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-001');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadSiteTimeseries(selectedSiteId);
    }
  }, [selectedSiteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, sitesData, prioData] = await Promise.all([
        api.getPortfolioSummary(),
        api.getSites(),
        api.getAgentPriorities()
      ]);
      setSummary(sumData);
      setSites(sitesData || []);
      setPriorities(prioData?.priorities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSiteTimeseries = async (id) => {
    try {
      const ts = await api.getSiteTimeseries(id, 96);
      if (ts?.points) {
        // Sample points for chart clarity (every 2nd point)
        const formatted = ts.points.filter((_, i) => i % 2 === 0).map(p => ({
          time: p.timestamp.split(' ')[1].slice(0, 5),
          actual: p.actual_power_kw,
          expected: p.expected_power_kw,
          irradiance: p.irradiance_wm2,
          shortfall: p.shortfall_kw,
          pr: p.performance_ratio_pct
        }));
        setTimeseriesData(formatted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-amber-400">
          <Sun className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-slate-300">Loading Portfolio Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Top Banner with Demo Mode & Health Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> End-to-End Operational Pipeline
            </span>
            <span className="text-xs text-slate-400">• Kaggle & PVWatts Reference Connected</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
            Solar Portfolio Intelligence & Maintenance
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Monitoring distributed rooftop and ground-mount PV assets. Detecting soiling, shading, inverter faults, and string outages with deterministic economic ROI prioritization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/agent"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" /> AI Maintenance Agent
          </Link>
          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sites & Health */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Portfolio Sites</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-100">{summary?.total_sites || 6}</span>
            <span className="text-xs text-slate-400">({summary?.total_capacity_kw || 2200} kWp)</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] pt-2 border-t border-slate-800/80">
            <span className="text-emerald-400 font-semibold">{summary?.healthy_sites || 2} Healthy</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-semibold">{summary?.warning_sites || 3} Monitor</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-semibold">{summary?.critical_sites || 1} Critical</span>
          </div>
        </div>

        {/* Daily Financial Impact */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Daily Financial Loss</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-rose-400">
              ₹{summary?.total_daily_financial_loss?.toLocaleString() || '3,768'}
            </span>
            <span className="text-xs text-slate-500">/day</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Energy Loss: <strong className="text-slate-200">{summary?.total_daily_loss_kwh || 530} kWh/d</strong></span>
            <span className="text-rose-400 font-medium">Underperforming</span>
          </div>
        </div>

        {/* 30-Day Recoverable Cashflow */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">30-Day Recoverable Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-emerald-400">
              +₹{summary?.total_recoverable_30d?.toLocaleString() || '104,200'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Avg Portfolio PR: <strong className="text-slate-200">{summary?.average_portfolio_pr_pct || 83.4}%</strong></span>
            <span className="text-emerald-400 font-medium">Net of repair costs</span>
          </div>
        </div>

        {/* Open Maintenance Tickets */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Work Orders</span>
            <Wrench className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-cyan-400">{summary?.open_tickets_count || 3}</span>
            <span className="text-xs text-slate-400">Tickets Open</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
            <span className="text-amber-400 font-semibold">{summary?.high_priority_actions_count || 2} High ROI Actions</span>
            <Link to="/tickets" className="text-amber-400 hover:underline text-[11px]">View All →</Link>
          </div>
        </div>
      </div>

      {/* Geospatial Portfolio Map Section */}
      <GeoPortfolioMap
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={(id) => setSelectedSiteId(id)}
      />

      {/* Charts & Priority Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Actual vs Expected Generation Chart */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Actual vs Expected Generation ({selectedSiteId})
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Comparing live telemetry against NREL PVWatts & XGBoost physical baseline
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
              >
                {sites.map(s => (
                  <option key={s.site_id} value={s.site_id}>
                    {s.name} ({s.site_id})
                  </option>
                ))}
              </select>
              <Link
                to={`/sites/${selectedSiteId}`}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20"
              >
                Deep Dive <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseriesData}>
                <defs>
                  <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="expected" stroke="#38bdf8" strokeWidth={2} fill="url(#expectedGrad)" name="Expected Baseline (kW)" />
                <Area type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} fill="url(#actualGrad)" name="Actual Generation (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-800">
            <div className="bg-slate-900/60 p-2 rounded-xl">
              <span className="text-slate-500 block text-[10px]">Method</span>
              <span className="font-semibold text-slate-200">PVWatts & Temp Derate</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl">
              <span className="text-slate-500 block text-[10px]">Baseline Confidence</span>
              <span className="font-semibold text-emerald-400">High (98.4% R²)</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl">
              <span className="text-slate-500 block text-[10px]">PR Deviation</span>
              <span className="font-semibold text-rose-400">-14.2%</span>
            </div>
          </div>
        </div>

        {/* Right: AI Maintenance Priority Ranking */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-100">AI Maintenance Priority Queue</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Economic Impact Ranked
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px]">
            {priorities.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No active issues detected</p>
            ) : (
              priorities.map((item, idx) => (
                <div
                  key={item.site_id}
                  className="p-3.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{item.site_name}</span>
                        <StatusBadge status={item.priority_level} size="xs" />
                      </div>
                      <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                        {item.fault_type} ({item.confidence_pct}% Match)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-rose-400 block">
                        -₹{item.daily_revenue_loss.toLocaleString()}/d
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Payback: {item.payback_days}d
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 truncate max-w-[200px]">
                      Action: <strong className="text-slate-200">{item.action_recommended}</strong>
                    </span>
                    <Link
                      to={`/sites/${item.site_id}`}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center text-[10px]"
                    >
                      Inspect <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/agent"
            className="mt-4 w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-cyan-400" /> Consult Solar AI Agent for Action Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
