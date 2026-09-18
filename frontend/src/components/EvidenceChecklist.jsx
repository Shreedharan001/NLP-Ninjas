import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function EvidenceChecklist({ evidenceList = [], faultName, confidence }) {
  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        No anomalous diagnostic indicators detected. Operating within physical reference bounds.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-300">Supporting Diagnostic Evidence</span>
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          {confidence}% Match
        </span>
      </div>

      <div className="space-y-2">
        {evidenceList.map((item, idx) => (
          <div 
            key={idx} 
            className={`p-2.5 rounded-xl border text-xs transition-colors ${
              item.matched 
                ? 'bg-slate-900/90 border-slate-700/80 text-slate-200' 
                : 'bg-slate-950/40 border-slate-800/40 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-start gap-2">
              {item.matched ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{item.indicator}</span>
                  <span className="text-[10px] text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded">
                    Observed: {item.observed_value}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.description}</p>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Expected Reference Baseline: {item.expected_baseline}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
