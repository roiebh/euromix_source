import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { APP_ID } from '../config/constants';
import { BarChart2, X } from 'lucide-react';

export default function StatsModal({ onClose, team, user }) {
    const [stats, setStats] = useState({});
    
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'stats'), (snap) => {
            if(snap.exists()) setStats(snap.data());
        }, (err) => {}); 
        return () => unsub();
    }, [user]);

    return (
        <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2"><BarChart2/> סטטיסטיקות צוות</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b dark:border-slate-700 text-sm text-slate-500">
                                <th className="p-2">שם</th>
                                <th className="p-2">כתבות</th>
                                <th className="p-2">אתר</th>
                                <th className="p-2">סוש. עברית</th>
                                <th className="p-2">סוש. אנגלית</th>
                                <th className="p-2 text-red-500">החזרות (קיבל)</th>
                                <th className="p-2 text-blue-500">החזרות (ביצע)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.map(member => {
                                const s = stats[member.name] || {};
                                return (
                                    <tr key={member.name} className="border-b dark:border-slate-700 dark:text-slate-300">
                                        <td className="p-2 font-bold">{member.name}</td>
                                        <td className="p-2">{s.wrote || 0}</td>
                                        <td className="p-2">{s.publishedSite || 0}</td>
                                        <td className="p-2">{s.publishedSocialHe || 0}</td>
                                        <td className="p-2">{s.publishedSocialEn || 0}</td>
                                        <td className="p-2 text-red-400">{s.returnedCount || 0}</td>
                                        <td className="p-2 text-blue-400">{s.editorReturns || 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <button onClick={onClose} className="mt-8 w-full bg-slate-200 dark:bg-slate-700 py-3 rounded-xl font-bold">סגור</button>
            </div>
        </div>
    );
}