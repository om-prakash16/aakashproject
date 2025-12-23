import { Newspaper, TrendingUp, Info } from "lucide-react";

export default function NewsPage() {
    const newsItems = [
        {
            id: 1,
            title: "Nifty hits all-time high as foreign inflows surge",
            source: "Market Times",
            time: "2 hours ago",
            impact: "Bullish",
        },
        {
            id: 2,
            title: "RBI keeps repo rate unchanged at 6.5%",
            source: "Financial Express",
            time: "4 hours ago",
            impact: "Neutral",
        },
        {
            id: 3,
            title: "HDFC Bank reports 20% YoY profit growth",
            source: "MoneyControl",
            time: "5 hours ago",
            impact: "Bullish",
        },
        {
            id: 4,
            title: "Global markets slide on hawkish Fed commentary",
            source: "Bloomberg",
            time: "8 hours ago",
            impact: "Bearish",
        },
        {
            id: 5,
            title: "Oil prices stable amidst geopolitical tensions",
            source: "Reuters",
            time: "12 hours ago",
            impact: "Neutral",
        },
    ];

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-800">
                        <Newspaper className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Market News</h1>
                        <p className="text-slate-400">Latest headlines and market moving updates</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {newsItems.map((item) => (
                        <div key={item.id} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                        <span className="font-semibold text-slate-400">{item.source}</span>
                                        <span>•</span>
                                        <span>{item.time}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-100">{item.title}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${item.impact === 'Bullish' ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400' :
                                        item.impact === 'Bearish' ? 'bg-red-950/50 border-red-800 text-red-400' :
                                            'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}>
                                    {item.impact}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg flex items-center gap-3 text-slate-400 text-sm">
                    <Info className="w-5 h-5" />
                    This is a demo news feed. Live API integration is pending.
                </div>
            </div>
        </main>
    );
}
