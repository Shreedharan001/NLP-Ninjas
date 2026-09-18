import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sun, Zap, TrendingDown, DollarSign, Wrench, ShieldAlert, ArrowLeft,
  Activity, Thermometer, CheckCircle2, AlertTriangle, Bot, RefreshCw, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart, Bar
} from 'recharts';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EvidenceChecklist from '../components/EvidenceChecklist';
import PaybackCard from '../components/PaybackCard';
import ClosedLoopCard from '../components/ClosedLoopCard';

export default function SiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [faultDiagnosis, setFaultDiagnosis] = useState(null);
  const [prSummary, setPrSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketAction, setTicketAction] = useState({
    title: '',
    description: '',
    assigned_to: 'Priya K (Lead Field Engineer)'
  });

  useEffect(() => {
    loadSiteData();
  }, [id]);

  const loadSiteData = async () => {
    try {
      setLoading(true);
      const [siteData, tsData, faultData, prData] = await Promise.all([
        api.getSiteById(id),
        api.getSiteTimeseries(id, 96),
        api.getSiteFaults(id),
        api.getPrSummary(id)
      ]);

      setSite(siteData);
      setFaultDiagnosis(faultData);
      setPrSummary(prData);

      if (tsData?.points) {
        const formatted = tsData.points.map(p => ({
          time: p.timestamp.split(' ')[1].slice(0, 5),
          actual: p.actual_power_kw,
          expected: p.expected_power_kw,
          irradiance: p.irradiance_wm2,
          moduleTemp: p.module_temp_c,
          ambientTemp: p.ambient_temp_c,
          shortfall: p.shortfall_kw,
          pr: p.performance_ratio_pct,
          isAnomaly: p.is_anomaly
        }));
        setTimeseries(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.createTicket({
        site_id: site.site_id,
        fault_type: faultDiagnosis?.probable_fault || 'Soiling',
        priority: faultDiagnosis?.severity || 'HIGH',
        title: ticketAction.title || `Maintenance Dispatch: ${faultDiagnosis?.probable_fault} on ${site.name}`,
        description: ticketAction.description || `Autonomous AI identified ${faultDiagnosis?.probable_fault} with estimated loss of ₹${site.daily_loss_financial}/day.`,
        estimated_daily_loss: site.daily_loss_financial,
        estimated_cost: site.cleaning_cost,
        payback_days: 2.5,
        recommended_action: faultDiagnosis?.signature_name || 'Panel Cleaning / Inspection',
        assigned_to: ticketAction.assigned_to
      });
      setShowTicketModal(false);
      navigate('/tickets');
    } catch (err) {
      alert('Error creating ticket: ' + err.message);
    }
  };

  if (loading && !site) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-amber-400">
          <Sun className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-slate-300">Loading Site Telemetry & AI Diagnostics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/portfolio"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-100">{site?.name}</h1>
              <StatusBadge status={site?.status} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {site?.location} • {site?.capacity_kw} kWp • Tilt {site?.tilt}° • Azimuth {site?.azimuth}° • Tariff: ₹{site?.tariff_per_kwh}/kWh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/agent?site=${site?.site_id}`}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <Bot className="w-4 h-4" /> Ask Agent About Site
          </Link>
          <button
            onClick={() => setShowTicketModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4" /> Create Work Order
          </button>
          <button
            onClick={loadSiteData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">Performance Ratio (PR)</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${
              (site?.daily_pr || 88) > 85 ? 'text-emerald-400' : ((site?.daily_pr || 88) > 75 ? 'text-amber-400' : 'text-rose-400')
            }`}>
              {site?.daily_pr || 88.5}%
            </span>
            <span className="text-[10px] text-slate-500">Baseline: 88.5%</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            PR Deviation: <strong className="text-rose-400">{prSummary?.pr_deviation_pct || -14.2}%</strong>
          </span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">Daily Energy Yield</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100">{site?.daily_energy_kwh || 420}</span>
            <span className="text-xs text-slate-500">/ {site?.daily_expected_kwh || 500} kWh</span>
          </div>
          <span className="text-[10px] text-rose-400 block mt-1 font-semibold">
            Shortfall: -{site?.daily_loss_kwh || 80} kWh/day
          </span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">Estimated Revenue Loss</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              ₹{site?.daily_loss_financial?.toLocaleString() || '600'}
            </span>
            <span className="text-xs text-slate-500">/day</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            ₹{(site?.daily_loss_financial * 30)?.toLocaleString() || '18,000'}/month projected
          </span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">AI Probable Issue</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-400 truncate">
              {faultDiagnosis?.probable_fault || 'Normal'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
            {faultDiagnosis?.confidence_pct || 92}% Signature Confidence
          </span>
        </div>
      </div>

      {/* Main Analysis Grid: Generation Curves & Weather Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Actual vs Expected Generation + Irradiance */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart 1: Actual vs Expected Power */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  Actual vs Expected Solar Power Generation (kW)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Yellow: Actual Telemetry • Blue: NREL PVWatts / XGBoost Reference Model
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                15-Min Intervals
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="expected" stroke="#38bdf8" strokeWidth={2} fill="url(#expGrad)" name="PVWatts Expected (kW)" />
                  <Area type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} fill="url(#actGrad)" name="Actual Measured (kW)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Solar Irradiance & Module Temperature */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  Weather Correlation: Solar Irradiance (W/m²) & Module Temp (°C)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Validating that generation loss is not caused by cloud pass or ambient thermal derating
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#f59e0b" fontSize={11} unit=" W/m²" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ec4899" fontSize={11} unit=" °C" domain={[15, 75]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="irradiance" stroke="#f59e0b" strokeWidth={2} dot={false} name="Irradiance (W/m²)" />
                  <Line yAxisId="right" type="monotone" dataKey="moduleTemp" stroke="#ec4899" strokeWidth={2} dot={false} name="Module Temp (°C)" />
                  <Line yAxisId="right" type="monotone" dataKey="ambientTemp" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Ambient Temp (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: AI Diagnosis & Economic Payback Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Diagnosis & Evidence Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">AI Diagnostic Inference</h3>
              </div>
              <StatusBadge status={faultDiagnosis?.severity || 'HIGH'} size="xs" />
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Probable Cause</span>
                <span className="font-black text-sm text-amber-400">{faultDiagnosis?.probable_fault}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 italic">
                "{faultDiagnosis?.signature_name}"
              </p>
            </div>

            <EvidenceChecklist
              evidenceList={faultDiagnosis?.evidence_checklist}
              faultName={faultDiagnosis?.probable_fault}
              confidence={faultDiagnosis?.confidence_pct}
            />
          </div>

          {/* Economic Payback Card */}
          <PaybackCard
            dailyLossRupees={site?.daily_loss_financial || 600}
            dailyLostKwh={site?.daily_loss_kwh || 80}
            tariff={site?.tariff_per_kwh || 7.5}
            costEstimate={site?.cleaning_cost || 1500}
            paybackDays={2.5}
            recoverable90d={52500}
            actionType={faultDiagnosis?.signature_name || 'Panel Cleaning'}
            onActionClick={() => setShowTicketModal(true)}
          />

          {/* Show Closed-Loop Verification Card if Hyderabad site */}
          {site?.site_id === 'SITE-006' && (
            <ClosedLoopCard
              closedLoopData={{
                ticket_id: "TKT-1004",
                site_id: "SITE-006",
                maintenance_date: "2026-09-16",
                pre_maintenance_pr_pct: 81.5,
                post_maintenance_pr_pct: 94.2,
                pr_improvement_pct: 12.7,
                pre_daily_gen_kwh: 760.0,
                post_daily_gen_kwh: 878.0,
                recovered_kwh_day: 118.0,
                recovered_revenue_day: 896.80,
                actual_payback_days: 2.45,
                verification_status: "Confirmed Improvement"
              }}
            />
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 mb-1">Create Maintenance Work Order</h3>
            <p className="text-xs text-slate-400 mb-4">
              Dispatch technician for {faultDiagnosis?.probable_fault} on {site?.name}
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Ticket Title</label>
                <input
                  type="text"
                  value={ticketAction.title}
                  onChange={(e) => setTicketAction({ ...ticketAction, title: e.target.value })}
                  placeholder={`Dispatch: ${faultDiagnosis?.probable_fault} on ${site?.name}`}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Assign Technician</label>
                <select
                  value={ticketAction.assigned_to}
                  onChange={(e) => setTicketAction({ ...ticketAction, assigned_to: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                >
                  <option value="Priya K (Lead Field Engineer)">Priya K (Lead Field Engineer)</option>
                  <option value="Arun V (Solar Specialist)">Arun V (Solar Specialist)</option>
                  <option value="Robotic Cleaning Crew Alpha">Robotic Cleaning Crew Alpha</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Autonomous Reasoning & Notes</label>
                <textarea
                  rows="3"
                  value={ticketAction.description}
                  onChange={(e) => setTicketAction({ ...ticketAction, description: e.target.value })}
                  placeholder={`Autonomous diagnosis indicated ${faultDiagnosis?.probable_fault} with estimated loss of ₹${site?.daily_loss_financial}/day and payback of 2.5 days.`}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Create & Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
