"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp, RefreshCw, Zap, ArrowUpDown, Info } from "lucide-react";

interface StockData {
    token: string;
    symbol: string;
    ltp: number;
    change_pct: number;
    strength_score: number;
    breakout_1d?: string;
    breakout_10d?: string;
    breakout_30d?: string;
    breakout_50d?: string;
    breakout_100d?: string;
    breakout_52w?: string;
    high_10d?: number;
    low_10d?: number;
    high_30d?: number;
    low_30d?: number;
    high_50d?: number;
    low_50d?: number;
    high_100d?: number;
    low_100d?: number;
    high_52w?: number;
    low_52w?: number;
    high_1d?: number;
    low_1d?: number;
    breakout_1d?: string;
    [key: string]: any;
}

const SECTIONS = [
    {
        id: "10d",
        title: "10-Day Breakouts",
        key: "breakout_10d",
        desc: "Intraday / short swing energy",
        highKey: "high_10d",
        lowKey: "low_10d"
    },
    {
        id: "30d",
        title: "30-Day Breakouts",
        key: "breakout_30d",
        desc: "Swing continuation",
        highKey: "high_30d",
        lowKey: "low_30d"
    },
    {
        id: "50d",
        title: "50-Day Breakouts",
        key: "breakout_50d",
        desc: "Trend confirmation",
        highKey: "high_50d",
        lowKey: "low_50d"
    },
    {
        id: "100d",
        title: "100-Day Breakouts",
        key: "breakout_100d",
        desc: "Medium-term trend shift",
        highKey: "high_100d",
        lowKey: "low_100d"
    },
    {
        id: "52w",
        title: "52-Week Breakouts",
        key: "breakout_52w",
        desc: "Long-term leadership",
        highKey: "high_52w",
        lowKey: "low_52w"
    },
];

export default function MarketPlusPage() {
    const [data, setData] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8000";

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/god-mode`);
            if (res.data.status === "success") {
                setData(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 5000);
        return () => clearInterval(interval);
    }, []);

    const MomentumRunners = () => {
        const gainers = [...data].filter(i => i.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct).slice(0, 4);
        const losers = [...data].filter(i => i.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 4);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Gainers */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-100">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                        <h2>Top Gainers <span className="text-sm font-normal text-slate-500">(Positive Momentum)</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {gainers.map((item) => (
                            <div key={item.token} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex justify-between items-center hover:border-emerald-900/50 transition-all">
                                <div>
                                    <h3 className="font-bold text-slate-200">{item.symbol}</h3>
                                    <div className="text-xs text-slate-500">Vol: {item.strength_score > 60 ? "High" : "Normal"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-slate-300">₹{item.ltp.toFixed(2)}</div>
                                    <div className="text-sm font-bold text-emerald-400">+{item.change_pct}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Top Losers */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-100">
                        <TrendingUp className="w-6 h-6 text-red-400 transform rotate-180" />
                        <h2>Top Losers <span className="text-sm font-normal text-slate-500">(Negative Momentum)</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {losers.map((item) => (
                            <div key={item.token} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex justify-between items-center hover:border-red-900/50 transition-all">
                                <div>
                                    <h3 className="font-bold text-slate-200">{item.symbol}</h3>
                                    <div className="text-xs text-slate-500">Vol: {item.strength_score > 60 ? "High" : "Normal"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-slate-300">₹{item.ltp.toFixed(2)}</div>
                                    <div className="text-sm font-bold text-red-400">{item.change_pct}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    };

    const BreakoutTable = ({ config }: { config: typeof SECTIONS[0] }) => {
        const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
        const [filterType, setFilterType] = useState<"All" | "Bullish" | "Bearish">("All");

        const filtered = data.filter((item) => {
            const status = item[config.key];
            if (!status || !status.includes("Breakout")) return false;
            // Filter by Type (Bullish/Bearish)
            if (filterType === "All") return true;
            return status.includes(filterType);
        });

        const sorted = [...filtered].sort((a, b) =>
            sortOrder === "desc" ? b.change_pct - a.change_pct : a.change_pct - b.change_pct
        );

        const getBadge = (status: string) => {
            const isBullish = status?.includes("Bullish");
            return (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${isBullish
                    ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
                    : "bg-red-950/30 text-red-400 border-red-900/50"
                    }`}>
                    {isBullish ? "▲" : "▼"} Breakout
                </span>
            );
        };

        return (
            <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-orange-500 rounded-full"></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">{config.title}</h2>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                                <Info className="w-4 h-4" />
                                <span>{config.desc}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Toggles */}
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        {["All", "Bullish", "Bearish"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as any)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === type
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                                    }`}
                            >
                                {type === "Bearish" ? "Negative" : type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Symbol</th>
                                <th className="p-4">LTP</th>
                                <th className="p-4">{config.title} Level</th>
                                <th className="p-4 text-right cursor-pointer hover:text-white flex justify-end items-center gap-1" onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}>
                                    Momentum <ArrowUpDown className="w-3 h-3" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {sorted.length > 0 ? sorted.map((item) => {
                                const status = item[config.key];
                                const isBullish = status?.includes("Bullish");
                                const targetLevel = isBullish ? item[config.highKey] : item[config.lowKey];

                                // Enhance: Calculate Diff from Pivot
                                const diff = targetLevel ? ((item.ltp - targetLevel) / targetLevel) * 100 : 0;
                                const diffFormatted = Math.abs(diff).toFixed(2);

                                return (
                                    <tr key={item.token} className="hover:bg-slate-800/50 group">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-200">{item.symbol}</div>
                                            <div className="flex items-center gap-1 mt-1">
                                                {/* Vol Badge Enhancement */}
                                                {item.strength_score > 70 && (
                                                    <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-800/50">High Vol</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-slate-300">₹{item.ltp.toFixed(2)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getBadge(status)}
                                            </div>
                                            <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                                                <span>
                                                    {isBullish ? 'Breaks >' : 'Breaks <'} {targetLevel?.toFixed(2)}
                                                </span>
                                                {/* Pivot Diff Enhancement */}
                                                <span className={`${isBullish ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                                    ({diff > 0 ? '+' : ''}{diffFormatted}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`p-4 font-bold text-right ${item.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {item.change_pct}%
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">No {filterType === "All" ? "" : filterType} {config.title} detected.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    };

    return (
        <main className="min-h-screen p-6 md:p-8 space-y-12">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">MarketPlus <span className="text-orange-500">Scanner</span></h1>
                    <p className="text-slate-400 text-sm mt-1">Advanced Multi-Timeframe Breakout Detection</p>
                </div>
                <button onClick={() => fetchData()} className="bg-slate-800 p-2.5 rounded-lg hover:bg-slate-700 transition-colors">
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <MomentumRunners />

            {/* Today's Breakouts Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-4">
                    <h2 className="text-2xl font-bold text-white">Today's <span className="text-orange-500">Breakouts</span></h2>
                    <span className="text-slate-500 text-sm">(Breaking Prev Day High/Low)</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <BreakoutTable config={{
                        id: "1d",
                        title: "1-Day Breakouts",
                        key: "breakout_1d",
                        desc: "Immediate Momentum (Prev Day High/Low)",
                        highKey: "high_1d",
                        lowKey: "low_1d"
                    }} />
                </div>
            </div>

            {/* Positional Breakouts Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-4">
                    <h2 className="text-2xl font-bold text-white">Positional <span className="text-blue-500">Breakouts</span></h2>
                    <span className="text-slate-500 text-sm">(Swing & Trend Trading)</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {SECTIONS.map(section => (
                        <BreakoutTable key={section.id} config={section} />
                    ))}
                </div>
            </div>
        </main>
    );
}
