"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { RefreshCw, AlertCircle, ShieldCheck, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StrengthPage() {
    const [data, setData] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState<string>("");

    // UI State
    const [activeTab, setActiveTab] = useState<"market" | "options">("market");
    const [chainSymbol, setChainSymbol] = useState("NIFTY");
    const [chainData, setChainData] = useState<any>(null);

    // Filters
    const [filters, setFilters] = useState({
        symbol: "",
        minPrice: "",
        maxPrice: "",
        minRsi: "",
        maxRsi: "",
        minScore: "",
        sentiment: "All"
    });

    const filteredData = data.filter(item => {
        const matchSymbol = item.symbol.toLowerCase().includes(filters.symbol.toLowerCase());
        const matchMinPrice = filters.minPrice ? item.ltp >= parseFloat(filters.minPrice) : true;
        const matchMaxPrice = filters.maxPrice ? item.ltp <= parseFloat(filters.maxPrice) : true;
        const matchMinRsi = filters.minRsi ? item.rsi >= parseFloat(filters.minRsi) : true;
        const matchMaxRsi = filters.maxRsi ? item.rsi <= parseFloat(filters.maxRsi) : true;
        const matchMinScore = filters.minScore ? item.strength_score >= parseFloat(filters.minScore) : true;
        const matchSentiment = filters.sentiment === "All" ? true : item.sentiment === filters.sentiment;

        return matchSymbol && matchMinPrice && matchMaxPrice && matchMinRsi && matchMaxRsi && matchMinScore && matchSentiment;
    });

    const API_URL = "http://localhost:8000";

    // Auto-check login status on mount
    // Auto-check login status on mount & Start Polling
    useEffect(() => {
        fetchGodMode();

        // Poll every 1 second for Real-Time updates
        const interval = setInterval(() => {
            if (isLoggedIn) {
                fetchGodMode(true); // Silent refresh
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const handleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${API_URL}/login`);
            if (res.data.status === "success") {
                setIsLoggedIn(true);
                fetchGodMode();
            } else {
                setError(res.data.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchGodMode = async (silent = false) => {
        if (!silent) setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${API_URL}/god-mode`);
            if (res.data.status === "success") {
                setData(res.data.data);
                setLastUpdated(new Date().toLocaleTimeString());
                setIsLoggedIn(true);
            } else {
                // If error implies auth, ensure we show login
                if (!silent) setError(res.data.message);
            }
        } catch (err: any) {
            // setError(err.response?.data?.message || err.message);
            // Fails silently on mount if not logged in
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchOptionsChain = async () => {
        setLoading(true);
        setError("");
        setChainData(null);
        try {
            const res = await axios.get(`${API_URL}/options-chain/${chainSymbol}`);
            if (res.data.status === "success") {
                setChainData(res.data);
            } else {
                setError(res.data.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        if (sentiment === "STRONG BUY") return "text-emerald-400 font-bold";
        if (sentiment === "STRONG SELL") return "text-red-400 font-bold";
        if (sentiment === "Bullish") return "text-emerald-400";
        if (sentiment === "Bearish") return "text-red-400";
        return "text-slate-400";
    };

    const getRowStyle = (sentiment: string) => {
        if (sentiment === "STRONG BUY") return "bg-emerald-950/20";
        if (sentiment === "STRONG SELL") return "bg-red-950/20";
        return "";
    };

    const getSentimentIcon = (sentiment: string) => {
        if (sentiment === "Bullish" || sentiment === "STRONG BUY") return <TrendingUp className="w-4 h-4" />;
        if (sentiment === "Bearish" || sentiment === "STRONG SELL") return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Market Strength & Options</h1>
                    {lastUpdated && <span className="text-xs text-slate-500">Updated: {lastUpdated}</span>}
                </div>

                {/* Login Section */}
                {!isLoggedIn && (
                    <div className="bg-slate-900/50 p-12 rounded-xl border border-slate-800 backdrop-blur-sm text-center max-w-lg mx-auto mt-12">
                        <ShieldCheck className="w-16 h-16 text-orange-400 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-3">Authentication Required</h2>
                        <p className="text-slate-400 mb-8">Connect to Angel One to access advanced analytics.</p>
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 w-full"
                        >
                            {loading ? "Connecting..." : "Connect to Angel One"}
                        </button>
                        {error && (
                            <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-200 text-left">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Data Section */}
                {isLoggedIn && (
                    <div className="space-y-6">

                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-slate-800">
                            <button
                                onClick={() => setActiveTab('market')}
                                className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === 'market' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400 hover:text-white'}`}
                            >
                                Market Scanner (God Mode)
                            </button>
                            <button
                                onClick={() => setActiveTab('options')}
                                className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === 'options' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400 hover:text-white'}`}
                            >
                                Options Chain
                            </button>
                        </div>

                        {/* Controls & Errors */}
                        {error && (
                            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-200 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {/* Market Scanner View */}
                        {activeTab === 'market' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => fetchGodMode(false)}
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                        Refresh Scanner
                                    </button>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-900 text-slate-400 text-sm uppercase tracking-wider sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-4 indent-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span>Symbol</span>
                                                            <input
                                                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500 w-full"
                                                                placeholder="Search..."
                                                                value={filters.symbol}
                                                                onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th className="p-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span>Price (LTP)</span>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-orange-500 w-20"
                                                                    placeholder="Min"
                                                                    value={filters.minPrice}
                                                                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                                                />
                                                                <input
                                                                    className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-orange-500 w-20"
                                                                    placeholder="Max"
                                                                    value={filters.maxPrice}
                                                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th className="p-4">Change %</th>
                                                    <th className="p-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span>RSI (14D)</span>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-orange-500 w-12"
                                                                    placeholder=">="
                                                                    value={filters.minRsi}
                                                                    onChange={(e) => setFilters({ ...filters, minRsi: e.target.value })}
                                                                />
                                                                <input
                                                                    className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-orange-500 w-12"
                                                                    placeholder="<="
                                                                    value={filters.maxRsi}
                                                                    onChange={(e) => setFilters({ ...filters, maxRsi: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th className="p-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span>Score</span>
                                                            <input
                                                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500 w-16"
                                                                placeholder="Min"
                                                                value={filters.minScore}
                                                                onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th className="p-4">
                                                        <div className="flex flex-col gap-2">
                                                            <span>Signal</span>
                                                            <select
                                                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500 w-full"
                                                                value={filters.sentiment}
                                                                onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
                                                            >
                                                                <option value="All">All</option>
                                                                <option value="STRONG BUY">Strong Buy</option>
                                                                <option value="Bullish">Bullish</option>
                                                                <option value="Bearish">Bearish</option>
                                                                <option value="STRONG SELL">Strong Sell</option>
                                                                <option value="Neutral">Neutral</option>
                                                            </select>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {filteredData.map((item) => (
                                                    <tr key={item.token} className={`hover:bg-slate-800/50 transition-colors ${getRowStyle(item.sentiment)}`}>
                                                        <td className="p-4 font-medium indent-4">{item.symbol}</td>
                                                        <td className="p-4 font-mono">₹{item.ltp.toFixed(2)}</td>
                                                        <td className={`p-4 font-mono ${item.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {item.change_pct > 0 ? '+' : ''}{item.change_pct}%
                                                        </td>
                                                        <td className="p-4 font-mono">
                                                            <span className={`px-2 py-1 rounded text-xs ${item.rsi > 70 ? 'bg-red-950 text-red-300' : item.rsi < 30 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                                                                {item.rsi}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${item.strength_score > 70 ? 'bg-emerald-500' : item.strength_score < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                                        style={{ width: `${item.strength_score}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-mono w-8">{item.strength_score}</span>
                                                            </div>
                                                        </td>
                                                        <td className={`p-4 font-medium flex items-center gap-2 ${getSentimentColor(item.sentiment)}`}>
                                                            {getSentimentIcon(item.sentiment)}
                                                            {item.sentiment}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredData.length === 0 && !loading && (
                                                    <tr>
                                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                                            No data available. Click Refresh to scan.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Options Chain View */}
                        {activeTab === 'options' && (
                            <div className="space-y-6">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chainSymbol}
                                        onChange={(e) => setChainSymbol(e.target.value.toUpperCase())}
                                        placeholder="Enter Symbol (e.g. NIFTY)"
                                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 w-64 focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                    <button
                                        onClick={fetchOptionsChain}
                                        disabled={loading}
                                        className="bg-orange-600 hover:bg-orange-500 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {loading ? "Fetching..." : "Get Chain"}
                                    </button>
                                </div>

                                {chainData && (
                                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold">{chainData.symbol}</h3>
                                            <div className="text-xl font-mono text-emerald-400">Spot: ₹{chainData.spot_price.toFixed(2)}</div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-center">
                                                <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                                                    <tr>
                                                        <th className="p-3 w-1/4">Call LTP</th>
                                                        <th className="p-3 w-1/4">Strike Price</th>
                                                        <th className="p-3 w-1/4">Put LTP</th>
                                                        <th className="p-3 w-1/4">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800 text-sm">
                                                    {chainData.chain.map((row: any) => (
                                                        <tr key={row.strike} className={row.type === 'ATM' ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'}>
                                                            <td className={`p-3 font-mono text-center font-semibold ${row.ce_ltp > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                                {row.ce_ltp ? `₹${row.ce_ltp.toFixed(2)}` : '-'}
                                                            </td>
                                                            <td className={`p-3 font-mono font-bold text-center ${row.type === 'ATM' ? 'text-white' : 'text-slate-300'}`}>
                                                                {row.strike.toFixed(2)}
                                                            </td>
                                                            <td className={`p-3 font-mono text-center font-semibold ${row.pe_ltp > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                                                {row.pe_ltp ? `₹${row.pe_ltp.toFixed(2)}` : '-'}
                                                            </td>
                                                            <td className="p-3 text-xs text-slate-500 text-center">{row.type}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-4 text-xs text-slate-500 text-center">
                                            *Real-time premiums require full Scrip Master lookup. Showing theoretical structure only.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
