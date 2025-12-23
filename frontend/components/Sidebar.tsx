"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, LayoutDashboard, TrendingUp, Newspaper, ChevronRight } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const [status, setStatus] = useState("Checking...");
    const API_URL = "http://localhost:8000";

    useEffect(() => {
        checkServer();
        const interval = setInterval(checkServer, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkServer = async () => {
        try {
            await axios.get(`${API_URL}/`, { timeout: 5000 });
            setStatus("System Online");
        } catch {
            setStatus("Backend Offline");
        }
    };

    const links = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Pro Scanner", href: "/pro", icon: Activity },
        { name: "Strength & F&O", href: "/strength", icon: TrendingUp },
        // { name: "MarketPlus", href: "/stocks/market-plus", icon: TrendingUp },
        { name: "Market News", href: "/news", icon: Newspaper },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 min-h-screen bg-slate-950 border-r border-slate-800 fixed left-0 top-0 overflow-y-auto z-40">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-100">
                        NGTA <span className="text-orange-500">Console</span>
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-1">
                <div className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Menu
                </div>
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? "bg-slate-900 text-orange-400 shadow-sm border border-slate-800/50"
                                : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300"}`} />
                                {link.name}
                            </div>
                            {isActive && <ChevronRight className="w-3 h-3 text-orange-500/50" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Status Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800/50">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-medium text-slate-400">System Status</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${status === "System Online" ? "text-emerald-400" : "text-red-400"
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${status === "System Online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                            }`} />
                        {status}
                    </div>
                </div>
            </div>
        </aside>
    );
}
