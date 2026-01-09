import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const formatDuration = (seconds) => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}ש ${m}ד`;
};

export default function LiveTimer({ startTime }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const start = startTime.seconds ? new Date(startTime.seconds * 1000) : new Date(startTime);
        const update = () => {
            const now = new Date();
            setElapsed(Math.floor((now - start) / 1000));
        };
        update();
        const interval = setInterval(update, 1000); 
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="bg-red-100/90 text-red-700 px-2 py-0.5 rounded-md font-bold shadow text-[11px] flex items-center gap-1 border border-red-200 mt-1 w-fit">
            <Timer size={12}/>
            <span>{formatDuration(elapsed)}</span>
        </div>
    );
}