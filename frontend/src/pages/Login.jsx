import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Shield, Lock, User, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('ops_lead');
  const [password, setPassword] = useState('ops123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
            <Sun className="w-7 h-7 text-slate-950" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
            SolarIntel Ops
          </h2>
          <p className="text-xs text-slate-400">
            Portfolio Intelligence & Autonomous Maintenance Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 pl-9 pr-3 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 pl-9 pr-3 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In to Operations Console"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Role Demo Selector */}
        <div className="pt-4 border-t border-slate-800 text-center space-y-2">
          <span className="text-[11px] text-slate-500 block font-medium">
            Demo Mode — Fast Sign-in by Persona:
          </span>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleQuickRole('admin', 'admin123')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickRole('ops_lead', 'ops123')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-lg text-[10px] font-semibold transition-colors"
            >
              Ops Manager
            </button>
            <button
              onClick={() => handleQuickRole('tech_priya', 'tech123')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-lg text-[10px] font-semibold transition-colors"
            >
              Technician
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
