import React from 'react';
import { CheckCircle2, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function ClosedLoopCard({ closedLoopData }) {
  if (!closedLoopData) return null;

  const {
    ticket_id,
    site_id,
    maintenance_date,
    pre_maintenance_pr_pct,
    post_maintenance_pr_pct,
    pr_improvement_pct,
    recovered_kwh_day,
    recovered_revenue_day,
    actual_payback_days,
    verification_status
  } = closedLoopData;

  return (
    <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 rounded-2xl border border-emerald-500/40 p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-300">Closed-Loop Verification Confirmed</h4>
            <p className="text-[11px] text-slate-400">Post-Maintenance Performance Validation</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          {verification_status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/20">
          <span className="text-slate-400 block text-[10px] mb-0.5">Pre-Maintenance PR</span>
          <span className="text-base font-bold text-slate-300">{pre_maintenance_pr_pct}%</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/20">
          <span className="text-slate-400 block text-[10px] mb-0.5">Post-Maintenance PR</span>
          <span className="text-base font-bold text-emerald-400">{post_maintenance_pr_pct}%</span>
          <span className="text-[10px] text-emerald-400 block font-semibold">+{pr_improvement_pct}% PR Boost</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/20">
          <span className="text-slate-400 block text-[10px] mb-0.5">Recovered Generation</span>
          <span className="text-base font-bold text-cyan-300">+{recovered_kwh_day} kWh</span>
          <span className="text-[10px] text-slate-500 block">Daily energy gain</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/20">
          <span className="text-slate-400 block text-[10px] mb-0.5">Daily Value Recovered</span>
          <span className="text-base font-bold text-amber-300">+₹{recovered_revenue_day}</span>
          <span className="text-[10px] text-slate-500 block">Payback: {actual_payback_days} days</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          Maintenance Executed: <strong className="text-slate-300">{maintenance_date}</strong>
        </span>
        <span className="text-emerald-400 font-medium">
          Outcome recorded into Machine Learning training dataset
        </span>
      </div>
    </div>
  );
}
