import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  Zap,
  Activity,
  AlertTriangle,
  Wrench,
  Bot,
  Cpu,
  FileCheck2,
  Settings,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ openTicketsCount = 0 }) {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/portfolio', label: 'Portfolio Map', icon: Globe2 },
    { to: '/sites', label: 'Solar Sites', icon: Zap },
    { to: '/anomalies', label: 'Anomaly Detector', icon: Activity },
    { to: '/faults', label: 'Fault Signatures', icon: AlertTriangle },
    { 
      to: '/tickets', 
      label: 'Maintenance Hub', 
      icon: Wrench,
      badge: openTicketsCount > 0 ? openTicketsCount : null,
      badgeColor: 'bg-rose-500'
    },
    { 
      to: '/agent', 
      label: 'Solar AI Agent', 
      icon: Bot,
      highlight: true
    },
    { to: '/models', label: 'ML Model Lab', icon: Cpu },
    { to: '/data-quality', label: 'Data Quality & Ingestion', icon: FileCheck2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c1222] border-r border-[#1e293b] flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-3 select-none">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2">
        Asset Operations
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/5'
                    : item.highlight
                    ? 'text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 border border-cyan-500/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-cyan-400 animate-pulse' : ''}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-amber-500'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Autonomous System Status Box */}
      <div className="mt-auto p-3 rounded-xl bg-gradient-to-b from-slate-900 to-[#111c33] border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Autonomous Engine Active
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          PVWatts & XGBoost comparing telemetry baselines continuously.
        </p>
      </div>
    </aside>
  );
}
