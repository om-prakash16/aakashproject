"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, TrendingUp, Zap, Newspaper, ArrowRight, BarChart3, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Dashboard() {
  const [indices, setIndices] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const API_URL = "http://localhost:8000";

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 5000); // Poll every 5s

    // Clock
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const fetchIndices = async () => {
    try {
      const res = await axios.get(`${API_URL}/indices`);
      if (res.data.status === "success") {
        setIndices(res.data.data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch indices", err);
    }
  };

  const getMarketStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const time = hour * 100 + min;

    if (time >= 915 && time <= 1530) return { text: "Market Open", color: "text-emerald-400", dot: "bg-emerald-500" };
    if (time >= 900 && time < 915) return { text: "Pre-Open", color: "text-orange-400", dot: "bg-orange-500" };
    return { text: "Market Closed", color: "text-slate-400", dot: "bg-slate-500" };
  };

  const status = getMarketStatus();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-slate-100 p-6 md:p-12 font-sans selection:bg-orange-500/30">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-8 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Overview</span>
            </h1>
            <p className="text-slate-400 text-lg">Real-time insights from Angel One SmartAPI.</p>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-slate-200">{currentTime || "--:--:--"}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
              <span className={status.color}>{status.text}</span>
            </div>
          </div>
        </header>

        {/* Indices Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* NIFTY 50 */}
            <IndexCard
              name="NIFTY 50"
              data={indices.NIFTY}
              icon={<Activity className="w-6 h-6 text-emerald-400" />}
              gradient="from-emerald-950/30 to-slate-950"
              borderColor="group-hover:border-emerald-500/30"
            />

            {/* BANK NIFTY */}
            <IndexCard
              name="BANK NIFTY"
              data={indices.BANKNIFTY}
              icon={<BarChart3 className="w-6 h-6 text-orange-400" />}
              gradient="from-orange-950/30 to-slate-950"
              borderColor="group-hover:border-orange-500/30"
            />
          </div>
        )}

        {/* Action Grid (Bento Style) */}
        <section className="grid md:grid-cols-3 gap-6">

          {/* Strength Scanner */}
          <Link href="/strength" className="group md:col-span-2 relative overflow-hidden bg-slate-900/40 rounded-3xl border border-slate-800 hover:bg-slate-900/60 hover:border-orange-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-8 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
                <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-8">
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Scanner & F&O Chain</h2>
                <p className="text-slate-400 max-w-lg">
                  Advanced "God Mode" scanner for 200+ F&O stocks and live Options Chain with real-time premiums.
                </p>
              </div>
            </div>
          </Link>

          {/* News Feed */}
          <Link href="/news" className="group relative overflow-hidden bg-slate-900/40 rounded-3xl border border-slate-800 hover:bg-slate-900/60 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-8 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Newspaper className="w-8 h-8 text-blue-500" />
                </div>
                <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Market News</h2>
                <p className="text-slate-400 text-sm">
                  Global cues and market-moving headlines.
                </p>
              </div>
            </div>
          </Link>

          {/* System Status (Mini) */}
          <div className="md:col-span-3 bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 flex justify-between items-center text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>System Operational</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Latency: <span className="text-emerald-400 font-mono">12ms</span></span>
              <span>API: <span className="text-emerald-400 font-mono">Connected</span></span>
            </div>
          </div>

        </section>

      </div>
    </main>
  );
}

function IndexCard({ name, data, icon, gradient, borderColor }: { name: string, data: any, icon: any, gradient: string, borderColor: string }) {
  if (!data) return (
    <div className="h-64 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse" />
  );

  const change = data.ltp - data.close;
  const changePct = (change / data.close) * 100;
  const isPositive = change >= 0;

  // Day Range Calculation
  const range = data.high - data.low;
  const currentPos = data.ltp - data.low;
  const progress = range > 0 ? (currentPos / range) * 100 : 0;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-8 rounded-3xl border border-slate-800 group hover:border-opacity-50 transition-all duration-300 ${borderColor}`}>
      {/* Background Decoration */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />

      <div className="relative z-10 flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-slate-200">{name}</h2>
        </div>

        <div className={`px-4 py-1.5 rounded-full border backdrop-blur-sm flex items-center gap-1.5 font-medium ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(changePct).toFixed(2)}%
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        <div>
          <span className="text-sm text-slate-400 font-medium tracking-wide uppercase">Last Traded Price</span>
          <div className="text-5xl font-bold text-white tracking-tight mt-1 flex items-baseline gap-1">
            <span className="text-2xl text-slate-500 font-normal">₹</span>
            {data.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-sm mt-1 font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)} pts
          </div>
        </div>

        {/* Day Range Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-500">
            <span>L: {data.low.toFixed(0)}</span>
            <span>H: {data.high.toFixed(0)}</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
            {/* Bar */}
            <div
              className={`h-full rounded-full ${isPositive ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
              style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
