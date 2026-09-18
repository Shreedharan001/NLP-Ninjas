import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sun, Bell, Shield, User, CheckCircle2, AlertTriangle, AlertOctagon, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ currentUser, onUserChange }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-[#0f172a]/95 border-b border-[#1e293b] sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Sun className="w-6 h-6 text-slate-950 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
              SolarIntel Ops
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Autonomous AI
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Portfolio Intelligence & Maintenance</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Role Switcher */}
        <div className="hidden md:flex items-center gap-2 bg-[#1e293b]/70 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Role:</span>
          <select 
            value={currentUser?.role || 'Operations Manager'}
            onChange={(e) => onUserChange && onUserChange(e.target.value)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="Admin" className="bg-slate-900 text-slate-200">Admin (Full Control)</option>
            <option value="Operations Manager" className="bg-slate-900 text-slate-200">Operations Manager</option>
            <option value="Technician" className="bg-slate-900 text-slate-200">Technician (Field)</option>
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-200">Operational Alerts</span>
                <button onClick={loadNotifications} className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No active notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleMarkRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.read ? 'bg-amber-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'critical' && <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{n.title}</span>
                            <span className="text-[10px] text-slate-500">{n.timestamp.split(' ')[1] || ''}</span>
                          </div>
                          <p className="text-slate-400 mt-0.5">{n.message}</p>
                          {n.site_id && (
                            <Link to={n.action_url || `/sites/${n.site_id}`} className="inline-block mt-1 text-[11px] text-amber-400 hover:underline">
                              Inspect Site →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-xs text-slate-950">
            {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">{currentUser?.full_name || 'Ananya Deshmukh'}</p>
            <p className="text-[11px] text-emerald-400">{currentUser?.role || 'Operations Lead'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
