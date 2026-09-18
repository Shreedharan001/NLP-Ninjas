import React from 'react';
import { DollarSign, Clock, TrendingUp, AlertCircle, Wrench } from 'lucide-react';

export default function PaybackCard({
  dailyLossRupees = 600,
  dailyLostKwh = 80,
  tariff = 7.5,
  costEstimate = 1500,
  paybackDays = 2.5,
  recoverable90d = 52500,
  actionType = "Panel Cleaning",
  onActionClick
}) {
  const isHighRoi = paybackDays <= 5.0;

  return (
    <div className="bg-gradient-to-br from-[#111c33] via-[#0f172a] to-[#131f37] rounded-2xl border border-slate-700/80 p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">Economic Impact & Payback</h4>
            <p className="text-[11px] text-slate-400">Financial ROI Analysis</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isHighRoi 
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        }`}>
          {isHighRoi ? 'High Financial Return' : 'Moderate Priority'}
        </span>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">Daily Revenue Loss</span>
          <span className="text-lg font-extrabold text-rose-400">
            ₹{dailyLossRupees.toLocaleString()}<span className="text-xs text-slate-500 font-normal">/day</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            ({dailyLostKwh} kWh @ ₹{tariff}/kWh)
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">Estimated Repair Cost</span>
          <span className="text-lg font-extrabold text-amber-300">
            ₹{costEstimate.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            {actionType}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">Payback Period</span>
          <span className={`text-lg font-extrabold ${isHighRoi ? 'text-emerald-400' : 'text-amber-400'}`}>
            {paybackDays} <span className="text-xs font-normal text-slate-400">Days</span>
          </span>
          <span className="text-[10px] text-emerald-500/90 block mt-0.5 font-medium">
            Fast capital recovery
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">90-Day Net Cashflow</span>
          <span className="text-lg font-extrabold text-cyan-300">
            +₹{recoverable90d.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            After maintenance cost
          </span>
        </div>
      </div>

      {/* Action Recommendation */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300 font-medium">
            Recommendation: <strong className="text-white">{actionType}</strong>
          </span>
        </div>
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
          >
            Create Ticket
          </button>
        )}
      </div>
    </div>
  );
}
