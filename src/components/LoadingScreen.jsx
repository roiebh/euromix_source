import React, { useState, useEffect } from 'react';
import { Loader2, Lightbulb } from 'lucide-react';
import { EUROVISION_FACTS } from '../config/constants';

export default function LoadingScreen({ status, progress, total }) {
    const [factIndex, setFactIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex(prev => (prev + 1) % EUROVISION_FACTS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#0f172a]/95 z-[200] flex flex-col items-center justify-center p-8 backdrop-blur-md">
            <div className="fixed top-0 left-0 right-0 h-2 bg-slate-800">
                 <div className="h-full bg-gradient-to-r from-[#002366] to-[#E3000F] transition-all duration-300" style={{width: total > 0 ? `${(progress/total)*100}%` : '0%'}}></div>
            </div>

            <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
                <div className="w-20 h-20 bg-[#002366] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-[#E3000F]">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">{status}</h2>
                {total > 0 && <p className="text-slate-400 mb-6 text-sm font-mono">מעבד: {progress} מתוך {total} ({Math.round((progress/total)*100)}%)</p>}
                
                <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600">
                    <div className="flex items-center justify-center gap-2 mb-3 text-[#E3000F] font-bold uppercase tracking-widest text-xs"><Lightbulb size={14}/> הידעת?</div>
                    <p className="text-lg text-slate-200 font-medium leading-relaxed transition-all duration-500 min-h-[80px] flex items-center justify-center">"{EUROVISION_FACTS[factIndex]}"</p>
                </div>
            </div>
        </div>
    );
}