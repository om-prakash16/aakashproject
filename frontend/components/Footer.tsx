import { Github } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} NGTA Stock Analyzer. Powered by <span className="text-orange-500 font-bold">Angel One SmartAPI</span>.
                </p>
                <div className="flex justify-center gap-4 mt-4 text-xs text-slate-600">
                    <span>Use for educational purposes only</span>
                </div>
            </div>
        </footer>
    );
}
