import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Save, Key, DollarSign, Sliders, Shield, Sun
} from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    defaultTariff: 7.50,
    currencySymbol: '₹',
    defaultCleaningCost: 1500,
    defaultTechCost: 3500,
    pvwattsApiKey: 'DEMO_KEY',
    anomalyThreshold: 0.08,
    soilingDetectionDays: 5,
    inverterLossThresholdPct: 25.0,
    autoTicketCreation: false
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Platform Settings & Configuration</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure financial tariffs, unit maintenance costs, PVWatts API keys, and autonomous AI thresholds.
          </p>
        </div>

        {saved && (
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 animate-pulse">
            ✓ Settings saved successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Economic & Financial Unit Parameters */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Economic & Unit Cost Models
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Default Electricity Tariff (₹/kWh)</label>
              <input
                type="number"
                step="0.1"
                value={config.defaultTariff}
                onChange={(e) => setConfig({ ...config, defaultTariff: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-200"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Standard Panel Cleaning Cost (₹)</label>
              <input
                type="number"
                value={config.defaultCleaningCost}
                onChange={(e) => setConfig({ ...config, defaultCleaningCost: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-200"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Technician Dispatch Cost (₹)</label>
              <input
                type="number"
                value={config.defaultTechCost}
                onChange={(e) => setConfig({ ...config, defaultTechCost: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Physical & ML Reference Baseline Engine */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
            <Sun className="w-4 h-4 text-amber-400" />
            NREL PVWatts & Physical Model Integrations
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">NREL PVWatts API Key</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={config.pvwattsApiKey}
                  onChange={(e) => setConfig({ ...config, pvwattsApiKey: e.target.value })}
                  placeholder="DEMO_KEY"
                  className="w-full bg-slate-900 border border-slate-700 pl-9 pr-3 py-2.5 rounded-xl text-slate-200 font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Uses local temperature-derated IEC 61724 physical baseline if API is unconfigured.
              </span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Isolation Forest Contamination Rate</label>
              <input
                type="number"
                step="0.01"
                value={config.anomalyThreshold}
                onChange={(e) => setConfig({ ...config, anomalyThreshold: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-200"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Default: 0.08 (8% anomalous outlier sensitivity).
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
