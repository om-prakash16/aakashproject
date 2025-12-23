"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { Activity } from "lucide-react";

export default function Navbar() {
    const [status, setStatus] = useState("Checking...");
    const API_URL = "http://localhost:8000";

    useEffect(() => {
        checkServer();
        const interval = setInterval(checkServer, 30000); // Check every 30s
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

    return (
        <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:hidden">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-100">
                            NGTA <span className="text-orange-500">Console</span>
                        </span>
                    </div>



                    {/* Status Pill */}
                    <div className="flex items-center">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${status === "System Online"
                            ? "bg-emerald-950/50 border-emerald-800 text-emerald-400"
                            : "bg-red-950/50 border-red-800 text-red-400"
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${status === "System Online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                            {status}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
