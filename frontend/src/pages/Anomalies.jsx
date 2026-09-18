import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Zap, AlertTriangle, ShieldCheck, RefreshCw, ChevronRight, Info
} from 'lucide-react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Anomalies() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-001');
  const [anomalyData, setAnomalyData] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadAnomalies(selectedSiteId);
    }
  }, [selectedSiteId]);

  const loadSites = async () => {
    try {
      const data = await api.getSites();
      setSites(data || []);
      if (data?.length > 0) setSelectedSiteId(data[0].site_id);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnomalies = async (siteId) => {
    try {
      setLoading(true);
      const [anom, ts] = await Promise.all([
        api.getSiteAnomalies(siteId),
        api.getSiteTimeseries(siteId, 96)
      ]);
      setAnomalyData(anom);
      if (ts?.points) {
        setTimeseries(ts.points);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scatterPoints = timeseries.map(p => ({
    irradiance: p.irradiance_wm2,
    actualPower: p.actual_power_kw,
    expectedPower: p.expected_power_kw,
    shortfall: p.shortfall_kw,
    anomalyScore: p.anomaly_score,
    isAnomaly: p.is_anomaly,
    time: p.timestamp.split(' ')[1].slice(0, 5)
  }));

  const normalPoints = scatterPoints.filter(p => !p.isAnomaly && p.irradiance > 20);
  const anomalousPoints = scatterPoints.filter(p => p.isAnomaly);

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-bold text-slate-100">Isolation Forest Anomaly Detector</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Unsupervised multi-dimensional generation anomaly detection with continuous anomaly scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            {sites.map(s => (
              <option key={s.site_id} value={s.site_id}>
                {s.name} ({s.site_id})
              </option>
            ))}
          </select>
          <button
            onClick={() => loadAnomalies(selectedSiteId)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-gradient-to-r from-rose-500/10 via-slate-900 to-amber-500/10 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-slate-100">
            About Isolation Forest Anomaly Scoring:
          </p>
          <p className="text-slate-400 leading-relaxed">
            The Isolation Forest algorithm identifies deviations in high-dimensional feature space (Irradiance, Temperature, Actual Power, Expected Baseline, Performance Ratio, and Hour of Day). It outputs an anomaly score (0.0 to 1.0) rather than a physical diagnosis. The subsequent Fault Classification layer uses behavioral signatures to interpret these anomalies.
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Total Records Scored</span>
          <span className="text-2xl font-black text-slate-100">{anomalyData?.total_records || 96}</span>
          <span className="text-[10px] text-slate-500 block mt-1">15-minute telemetry intervals</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Anomalies Detected</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{anomalyData?.anomalies_detected || 0}</span>
            <span className="text-xs text-rose-400 font-semibold">({anomalyData?.anomaly_rate_pct || 0}%)</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">Exceeds 2σ isolation threshold</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Contamination Parameter</span>
          <span className="text-2xl font-black text-amber-400">8.0%</span>
          <span className="text-[10px] text-slate-500 block mt-1">Calibrated for rooftop portfolios</span>
        </div>
      </div>

      {/* Scatter Chart: Power vs Irradiance with Anomalies */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              Irradiance (W/m²) vs Actual Generation (kW) Feature Space
            </h3>
            <p className="text-[11px] text-slate-400">
              Green: Normal Expected Tracking • Red: Anomalous Suppression (Isolation Forest Outliers)
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" dataKey="irradiance" name="Irradiance" unit=" W/m²" stroke="#64748b" fontSize={11} domain={[0, 1000]} />
              <YAxis type="number" dataKey="actualPower" name="Actual Power" unit=" kW" stroke="#64748b" fontSize={11} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Scatter name="Nominal Generation" data={normalPoints} fill="#10b981" opacity={0.7} />
              <Scatter name="Flagged Anomalies" data={anomalousPoints} fill="#f43f5e" shape="cross" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Anomaly Records Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="font-bold text-sm text-slate-100 mb-3">Recent Flagged Outliers ({selectedSiteId})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actual Power</th>
                <th className="py-2.5 px-3">Expected Power</th>
                <th className="py-2.5 px-3">Shortfall (kW)</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {anomalyData?.recent_anomalies?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500">
                    No active generation anomalies detected on {selectedSiteId}
                  </td>
                </tr>
              ) : (
                anomalyData?.recent_anomalies?.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-3 font-mono text-slate-300">{a.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">{a.actual_power_kw} kW</td>
                    <td className="py-2.5 px-3 text-cyan-400">{a.expected_power_kw} kW</td>
                    <td className="py-2.5 px-3 font-bold text-rose-400">-{a.shortfall_kw} kW</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {a.anomaly_score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status="Critical" size="xs" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
