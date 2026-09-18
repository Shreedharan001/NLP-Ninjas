import React from 'react';

export default function StatusBadge({ status, size = 'sm' }) {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'optimal':
      case 'resolved':
      case 'confirmed improvement':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'warning':
      case 'monitor':
      case 'medium':
      case 'in progress':
      case 'assigned':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'critical':
      case 'action required':
      case 'high':
      case 'open':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'offline':
      case 'dismissed':
        return 'bg-slate-700/40 text-slate-400 border-slate-600';
      default:
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : (size === 'lg' ? 'text-xs px-3 py-1 font-bold' : 'text-[11px] px-2 py-0.5');

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${getStyles()} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status?.toLowerCase() === 'healthy' || status?.toLowerCase() === 'resolved' ? 'bg-emerald-400' :
        status?.toLowerCase() === 'warning' || status?.toLowerCase() === 'medium' ? 'bg-amber-400' :
        status?.toLowerCase() === 'critical' || status?.toLowerCase() === 'high' ? 'bg-rose-400' : 'bg-slate-400'
      }`} />
      {status}
    </span>
  );
}
