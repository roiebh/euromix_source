import React, { useState, useEffect } from 'react';

export default function TourOverlay({ steps, onClose }) {
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState(null);
    const current = steps[step];

    useEffect(() => {
        const el = document.getElementById(current.targetId);
        if (el) {
            const r = el.getBoundingClientRect();
            setRect(r);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setRect(null); 
        }
    }, [step, current]);

    const nextStep = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else onClose();
    };

    return (
        <div className="fixed inset-0 z-[500] overflow-hidden">
            <div className="absolute inset-0 bg-black/60 transition-all duration-300">
                {rect && (
                    <div style={{
                        position: 'absolute',
                        top: rect.top - 5,
                        left: rect.left - 5,
                        width: rect.width + 10,
                        height: rect.height + 10,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                        borderRadius: '8px',
                        zIndex: 501,
                        transition: 'all 0.3s ease-out',
                        border: '2px solid #E3000F'
                    }}></div>
                )}
            </div>

            <div className="absolute bg-white dark:bg-slate-800 p-5 rounded-xl shadow-2xl pointer-events-auto border-2 border-[#002366] max-w-sm w-full transition-all duration-300 z-[502]"
                 style={{ 
                     top: rect ? (rect.bottom + 20 > window.innerHeight ? rect.top - 180 : rect.bottom + 20) : '50%', 
                     left: rect ? Math.min(Math.max(20, rect.left), window.innerWidth - 320) : '50%',
                     transform: rect ? 'none' : 'translate(-50%, -50%)'
                 }}>
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg dark:text-white">{current.title}</h4>
                    <span className="text-xs text-slate-400 font-mono">{step + 1}/{steps.length}</span>
                </div>
                <p className="text-sm mb-4 dark:text-slate-300 leading-relaxed">{current.text}</p>
                <div className="flex justify-between items-center">
                    <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 underline">סגור מדריך</button>
                    <div className="flex gap-2">
                        {step > 0 && <button onClick={() => setStep(step - 1)} className="px-3 py-1.5 rounded text-xs bg-slate-100 hover:bg-slate-200 text-slate-700">הקודם</button>}
                        <button onClick={nextStep} className="bg-[#002366] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-900 shadow">
                            {step === steps.length - 1 ? 'סיים' : 'הבא'}
                        </button>
                    </div>
                </div>
                {rect && (
                    <div className="absolute w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-[#002366] transform rotate-45"
                         style={{
                             top: (rect.bottom + 20 > window.innerHeight ? '100%' : '-10px'),
                             marginTop: (rect.bottom + 20 > window.innerHeight ? '-8px' : '0'),
                             left: '20px',
                             backgroundColor: 'inherit'
                         }}
                    ></div>
                )}
            </div>
        </div>
    );
};