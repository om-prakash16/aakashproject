"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Filter, ArrowUpDown, Brain, TrendingUp, TrendingDown, Minus, Activity, ArrowUp, ArrowDown, X, SlidersHorizontal } from "lucide-react";

export default function ProScannerPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filterShorting, setFilterShorting] = useState(false);
    const [filterSignals, setFilterSignals] = useState(false);

    // Multi-Column Filters
    // Store min/max for numbers, specific values for strings
    const [filters, setFilters] = useState<{ [key: string]: { min?: string, max?: string, value?: string } }>({
        change_current: { min: "", max: "" },
        change_1d: { min: "", max: "" },
        change_2d: { min: "", max: "" },
        change_3d: { min: "", max: "" },
        avg_3d: { min: "", max: "" },
        rsi: { min: "", max: "" },
        strength_score: { min: "", max: "" },
        dom_1d: { value: "All" },
        dom_2d: { value: "All" },
        dom_3d: { value: "All" },
        macd_signal: { value: "All" }
    });

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc', mode: 'standard' | 'absolute' }>({
        key: 'avg_3d',
        direction: 'asc',
        mode: 'absolute' // Default: Closest to 0
    });

    const API_URL = "http://localhost:8000";

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/god-mode`);
            if (res.data.status === "success") {
                setData(res.data.data);
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch", err);
        }
    };

    // Handler for Column Header Clicks
    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current.key === key) {
                if (current.mode === 'absolute') {
                    return { key, direction: 'asc', mode: 'standard' };
                }
                return {
                    key,
                    direction: current.direction === 'asc' ? 'desc' : 'asc',
                    mode: 'standard'
                };
            }
            return { key, direction: 'desc', mode: 'standard' };
        });
    };

    // Handler for Filter Inputs
    const handleFilterChange = (key: string, type: 'min' | 'max' | 'value', value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: { ...prev[key], [type]: value }
        }));
    };

    const clearFilters = () => {
        setFilters({
            change_current: { min: "", max: "" },
            change_1d: { min: "", max: "" },
            change_2d: { min: "", max: "" },
            change_3d: { min: "", max: "" },
            avg_3d: { min: "", max: "" },
            rsi: { min: "", max: "" },
            strength_score: { min: "", max: "" },
            dom_1d: { value: "All" },
            dom_2d: { value: "All" },
            dom_3d: { value: "All" },
            macd_signal: { value: "All" }
        });
        setFilterShorting(false);
        setFilterSignals(false);
    };

    // Advanced Filtering & Sorting Logic
    const processedData = useMemo(() => {
        let res = [...data];

        // 1. Filter: "Shorting"
        if (filterShorting) {
            res = res.filter(item => item.dom_current === "Sellers" || item.change_pct < 0);
        }

        // 2. Filter: "Smart Signals"
        if (filterSignals) {
            res = res.filter(item => {
                const significantRSI = item.rsi < 40 || item.rsi > 60;
                const significantMACD = item.macd_signal && item.macd_signal !== "Neutral";
                return significantRSI && significantMACD;
            });
        }

        // 3. Multi-Column Filters
        Object.keys(filters).forEach(key => {
            const f = filters[key];

            // Numeric Range Logic
            if (f.min !== undefined || f.max !== undefined) {
                if (f.min !== "" || f.max !== "") {
                    res = res.filter(item => {
                        const val = item[key];
                        if (typeof val !== 'number') return false;
                        const minVal = f.min && f.min !== "" ? parseFloat(f.min) : -Infinity;
                        const maxVal = f.max && f.max !== "" ? parseFloat(f.max) : Infinity;
                        return val >= minVal && val <= maxVal;
                    });
                }
            }

            // Categorical logic
            if (f.value && f.value !== "All") {
                res = res.filter(item => {
                    const val = item[key];
                    if (!val) return false; // if data missing

                    // Special MACD "Groups"
                    if (key === "macd_signal") {
                        if (f.value === "Bullish (All)") return val.includes("Bullish");
                        if (f.value === "Bearish (All)") return val.includes("Bearish");
                    }

                    return val === f.value;
                });
            }
        });

        // 4. Sorting
        res.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // Handle Strength Score
            if (sortConfig.key === 'strength_score') {
                valA = a.strength_score;
                valB = b.strength_score;
            }

            // Absolute Sort Mode
            if (sortConfig.mode === 'absolute') {
                return Math.abs(valA) - Math.abs(valB);
            }

            // Standard Sort
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return res;
    }, [data, filterShorting, filterSignals, filters, sortConfig]);

    const getDomColor = (dom: string) => {
        if (!dom) return "text-slate-400 bg-slate-900/30";
        if (dom === "Buyers") return "text-emerald-400 bg-emerald-950/30 border-emerald-500/20";
        if (dom === "Sellers") return "text-red-400 bg-red-950/30 border-red-500/20";
        if (dom === "Balance") return "text-yellow-400 bg-yellow-950/30 border-yellow-500/20";
        return "text-slate-400 bg-slate-900/30";
    };

    const renderSortIcon = (columnKey: string) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        if (sortConfig.mode === 'absolute') return <Minus className="w-3 h-3 text-orange-400" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />;
    };

    // Updated: Helper to check if any specific range filter is active
    const activeFilterCount = Object.values(filters).reduce((acc, curr) => {
        if (curr.min && curr.min !== "") return acc + 1;
        if (curr.max && curr.max !== "") return acc + 1;
        if (curr.value && curr.value !== "All") return acc + 1;
        return acc;
    }, 0);

    return (
        <main className="min-h-screen bg-[#050505] text-slate-200 font-sans p-4">
            <div className="max-w-[1800px] mx-auto space-y-4">

                {/* Header & Controls */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Brain className="text-orange-500 w-8 h-8" />
                                Pro Analytics <span className="text-slate-500 text-lg font-normal">Real-time F&O Scanner</span>
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Scanning {data.length} Real-Time Instruments
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                            {/* Toggle Filter Panel */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border border-slate-700 ${showFilters || activeFilterCount > 0 ? 'bg-blue-950/50 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                {showFilters ? "Hide Filters" : `Filters ${activeFilterCount > 0 ? `(${activeFilterCount})` : ''}`}
                            </button>

                            {/* Smart Signals */}
                            <button
                                onClick={() => setFilterSignals(!filterSignals)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${filterSignals ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <Activity className="w-4 h-4" />
                                {filterSignals ? "Signals: ACTIVE" : "Smart Signals"}
                            </button>

                            {/* Shorting Filter */}
                            <button
                                onClick={() => setFilterShorting(!filterShorting)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${filterShorting ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <TrendingDown className="w-4 h-4" />
                                {filterShorting ? "Shorting Mode: ON" : "Shorting Filter"}
                            </button>

                            {/* Preset Sort: Consolidation */}
                            <button
                                onClick={() => setSortConfig({ key: 'avg_3d', direction: 'asc', mode: 'absolute' })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border border-slate-700 transition-all ${sortConfig.mode === 'absolute' ? 'bg-orange-950/40 text-orange-400 border-orange-500/30' : 'bg-transparent text-slate-400 hover:text-white'}`}
                            >
                                <Minus className="w-4 h-4" />
                                Consolidation Sort (0%)
                            </button>
                        </div>
                    </div>

                    {/* Collapsible Filter Panel */}
                    {showFilters && (
                        <div className="bg-slate-950/50 p-5 rounded-xl border border-dashed border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Multi-Column Filters
                                </h3>
                                <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Reset All
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {/* Numeric Filters */}
                                {[
                                    { label: "Today %", key: "change_current" },
                                    { label: "Past 1D %", key: "change_1d" },
                                    { label: "Past 2D %", key: "change_2d" },
                                    { label: "Past 3D %", key: "change_3d" },
                                    { label: "Avg 3D %", key: "avg_3d" },
                                    { label: "RSI", key: "rsi" },
                                    { label: "Score", key: "strength_score" },
                                ].map((f) => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[10px] uppercase text-slate-500 font-semibold">{f.label}</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={filters[f.key]?.min || ""}
                                                onChange={(e) => handleFilterChange(f.key, 'min', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={filters[f.key]?.max || ""}
                                                onChange={(e) => handleFilterChange(f.key, 'max', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Categorical Filters */}
                                {[
                                    { label: "Dom 1D", key: "dom_1d", options: ["All", "Buyers", "Sellers", "Balance"] },
                                    { label: "Dom 2D", key: "dom_2d", options: ["All", "Buyers", "Sellers", "Balance"] },
                                    { label: "Dom 3D", key: "dom_3d", options: ["All", "Buyers", "Sellers", "Balance"] },
                                    { label: "MACD Signal", key: "macd_signal", options: ["All", "Bullish (All)", "Bearish (All)", "Bullish Growing", "Bullish Waning", "Bearish Growing", "Bearish Waning", "Neutral"] },
                                ].map((f) => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[10px] uppercase text-slate-500 font-semibold">{f.label}</label>
                                        <select
                                            value={filters[f.key]?.value || "All"}
                                            onChange={(e) => handleFilterChange(f.key, 'value', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 transition-all text-slate-300"
                                        >
                                            {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Grid */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/20 backdrop-blur-sm">
                    <div className="overflow-x-auto max-h-[85vh]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold sticky top-0 z-10 shadow-xl">
                                <tr>
                                    <th className="p-4 bg-slate-950 sticky left-0 z-20 border-r border-slate-800 w-32">Symbol</th>
                                    <th className="p-4 text-center border-r border-slate-800/50">LTP</th>

                                    {/* Group: Current */}
                                    <th
                                        className="p-4 text-center bg-slate-900/50 cursor-pointer hover:text-white transition-colors select-none"
                                        onClick={() => handleSort('change_current')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Today % {renderSortIcon('change_current')}
                                        </div>
                                    </th>
                                    <th className="p-4 text-center bg-slate-900/50 border-r border-slate-800/50 cursor-pointer hover:text-white" onClick={() => handleSort('strength_score')}>
                                        <div className="flex items-center justify-center gap-2">Str. {renderSortIcon('strength_score')}</div>
                                    </th>

                                    {/* Group: Past 1 Day */}
                                    <th
                                        className="p-4 text-center cursor-pointer hover:text-white transition-colors select-none"
                                        onClick={() => handleSort('change_1d')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Past 1D % {renderSortIcon('change_1d')}
                                        </div>
                                    </th>
                                    <th className="p-4 text-center border-r border-slate-800/50">Dom 1D</th>

                                    {/* Group: Past 2 Day */}
                                    <th
                                        className="p-4 text-center cursor-pointer hover:text-white transition-colors select-none"
                                        onClick={() => handleSort('change_2d')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Past 2D % {renderSortIcon('change_2d')}
                                        </div>
                                    </th>
                                    <th className="p-4 text-center border-r border-slate-800/50">Dom 2D</th>

                                    {/* Group: Past 3 Day (NEW) */}
                                    <th
                                        className="p-4 text-center cursor-pointer hover:text-white transition-colors select-none"
                                        onClick={() => handleSort('change_3d')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Past 3D % {renderSortIcon('change_3d')}
                                        </div>
                                    </th>
                                    <th className="p-4 text-center border-r border-slate-800/50">Dom 3D</th>

                                    {/* Group: Average */}
                                    <th
                                        className="p-4 text-center bg-slate-900/50 text-orange-400 cursor-pointer hover:text-orange-300 transition-colors select-none"
                                        onClick={() => handleSort('avg_3d')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Past 3D Avg % {renderSortIcon('avg_3d')}
                                        </div>
                                    </th>
                                    <th className="p-4 text-center bg-slate-900/50 text-orange-400 border-r border-slate-800/50">Past 3D Avg Dom</th>

                                    {/* Indicators */}
                                    <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('rsi')}>
                                        <div className="flex items-center justify-center gap-2">RSI {renderSortIcon('rsi')}</div>
                                    </th>
                                    <th className="p-4 text-center">MACD</th>
                                    <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('strength_score')}>
                                        <div className="flex items-center justify-center gap-2">Score {renderSortIcon('strength_score')}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={15} className="p-12 text-center text-slate-500 animate-pulse">
                                            Scanning Market...
                                        </td>
                                    </tr>
                                ) : processedData.map((item, idx) => (
                                    <tr key={item.token} className={`hover:bg-slate-800/40 transition-colors group ${idx % 2 === 0 ? 'bg-slate-900/10' : ''}`}>
                                        <td className="p-4 font-bold text-white sticky left-0 bg-[#0a0a0a] group-hover:bg-slate-800 border-r border-slate-800">
                                            {item.symbol}
                                        </td>
                                        <td className="p-4 font-mono text-center text-slate-300">
                                            {item.ltp.toFixed(2)}
                                        </td>

                                        {/* Current */}
                                        <td className={`p-4 font-mono text-center font-bold bg-slate-900/20 ${item.change_current >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {item.change_current > 0 ? '+' : ''}{item.change_current}%
                                        </td>
                                        <td className="p-4 text-center bg-slate-900/20 border-r border-slate-800/50">
                                            <span className={`px-2 py-0.5 rounded text-[10px] border ${getDomColor(item.dom_current)}`}>
                                                {item.dom_current ? item.dom_current.toUpperCase().slice(0, 4) : "-"}
                                            </span>
                                        </td>

                                        {/* 1D */}
                                        <td className={`p-4 font-mono text-center ${item.change_1d >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                            {item.change_1d}%
                                        </td>
                                        <td className="p-4 text-center border-r border-slate-800/50">
                                            <span className={`text-[10px] opacity-70 ${item.dom_1d === 'Buyers' ? 'text-emerald-400' : 'text-red-400'}`}>{item.dom_1d && item.dom_1d[0]}</span>
                                        </td>

                                        {/* 2D */}
                                        <td className={`p-4 font-mono text-center ${item.change_2d >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                            {item.change_2d}%
                                        </td>
                                        <td className="p-4 text-center border-r border-slate-800/50">
                                            <span className={`text-[10px] opacity-70 ${item.dom_2d === 'Buyers' ? 'text-emerald-400' : 'text-red-400'}`}>{item.dom_2d && item.dom_2d[0]}</span>
                                        </td>

                                        {/* 3D */}
                                        <td className={`p-4 font-mono text-center ${item.change_3d >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                            {item.change_3d}%
                                        </td>
                                        <td className="p-4 text-center border-r border-slate-800/50">
                                            <span className={`text-[10px] opacity-70 ${item.dom_3d === 'Buyers' ? 'text-emerald-400' : 'text-red-400'}`}>{item.dom_3d && item.dom_3d[0]}</span>
                                        </td>

                                        {/* Avg 3D */}
                                        <td className={`p-4 font-mono text-center font-bold bg-slate-900/20 ${Math.abs(item.avg_3d) < 0.5 ? 'text-white' : (item.avg_3d > 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                                            {item.avg_3d}%
                                        </td>
                                        <td className="p-4 text-center bg-slate-900/20 border-r border-slate-800/50">
                                            <span className={`px-2 py-0.5 rounded text-[10px] border ${getDomColor(item.avg_dom_3d)}`}>
                                                {item.avg_dom_3d ? item.avg_dom_3d.toUpperCase() : "N/A"}
                                            </span>
                                        </td>

                                        {/* Indicators */}
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`text-[10px] font-bold ${item.rsi > 70 ? 'text-red-400' : item.rsi < 30 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                    {item.rsi}
                                                </span>
                                                {/* RSI Visual Bar */}
                                                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden relative">
                                                    <div className={`h-full absolute top-0 left-0 ${item.rsi < 30 ? 'bg-emerald-500' : item.rsi > 70 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${item.rsi}%` }} />
                                                    {/* Zone Markers */}
                                                    <div className="absolute top-0 left-[30%] w-px h-full bg-slate-900/50"></div>
                                                    <div className="absolute top-0 left-[70%] w-px h-full bg-slate-900/50"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[9px] uppercase font-bold tracking-wider whitespace-nowrap
                                                ${item.macd_signal?.includes("Bullish") ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
                                                    item.macd_signal?.includes("Bearish") ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                                                        'bg-slate-800 text-slate-400'}`}>
                                                {item.macd_signal === "Bullish Growing" ? "BULL++" :
                                                    item.macd_signal === "Bullish Waning" ? "BULL+" :
                                                        item.macd_signal === "Bearish Growing" ? "BEAR--" :
                                                            item.macd_signal === "Bearish Waning" ? "BEAR-" : "NEUTRAL"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.strength_score > 60 ? 'bg-purple-500' : item.strength_score < 40 ? 'bg-stone-500' : 'bg-blue-500'}`} style={{ width: `${item.strength_score}%` }} />
                                                </div>
                                                <span className={`text-[10px] font-bold ${item.strength_score > 60 ? 'text-purple-400' : 'text-slate-500'}`}>{item.strength_score}</span>
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
