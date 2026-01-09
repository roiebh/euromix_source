import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';
import { FileText, Flag, UserPlus, Share2, ImageIcon, Clock, Trash2, Loader2, CheckCircle, Globe, Languages } from 'lucide-react';
import { db } from '../config/firebase';
import { APP_ID } from '../config/constants';
import { ContentProcessor } from '../services/ContentProcessor';

// --- LiveTimer Implementation ---
const formatDuration = (seconds) => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}ש ${m}ד`;
};

const LiveTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!startTime) return;
        const start = startTime.seconds ? new Date(startTime.seconds * 1000) : new Date(startTime);
        const update = () => setElapsed(Math.max(0, Math.floor((new Date() - start) / 1000)));
        update();
        const interval = setInterval(update, 1000); 
        return () => clearInterval(interval);
    }, [startTime]);
    return (
        <span className="text-[10px] font-mono text-red-400 bg-red-900/20 px-1.5 rounded border border-red-900/30 flex items-center gap-1">
            <Clock size={10}/> {formatDuration(elapsed)}
        </span>
    );
};

// --- Helpers ---
const updateUserStats = async (userName, field, delta) => {
    if (!userName) return;
    try {
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'stats');
        await updateDoc(statsRef, { [`${userName}.${field}`]: increment(delta) });
    } catch (e) {
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'stats');
        try { await setDoc(statsRef, { [userName]: { [field]: delta } }, { merge: true }); } catch(e2) {}
    }
};

const timeSince = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const seconds = Math.floor((new Date() - d) / 1000);
    if (seconds < 60) return "עכשיו";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}ד'`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}ש'`;
    const days = Math.floor(hours / 24);
    return `${Math.floor(days)}ימ'`;
};

export default function ArticleCard({ article, user, showImages, team, viewMode, globalLang, onUpdate, onDelete, isMobile }) {
    const [localImg, setLocalImg] = useState(article.img || null);
    const [showAssign, setShowAssign] = useState(false);
    const [docLinkMode, setDocLinkMode] = useState(false); 
    const [docLinkInput, setDocLinkInput] = useState(article.docLink || '');
    const dropdownRef = useRef(null);

    useEffect(() => { if (article.img) setLocalImg(article.img); }, [article.img]);

    // שפה ותרגום
    let displayTitle = article.title;
    let displaySnippet = article.snippet || '';
    let isTranslating = false;

    if (globalLang === 'he') {
        if (article.titleHe) {
            displayTitle = article.titleHe;
            displaySnippet = article.snippetHe || displaySnippet;
        } else isTranslating = true;
    } else if (globalLang === 'en') {
        if (article.titleEn) {
            displayTitle = article.titleEn;
            displaySnippet = article.snippetEn || displaySnippet;
        } else isTranslating = true;
    } else {
        displayTitle = article.originalTitle || article.title;
    }

    const dir = ContentProcessor.detectLanguage(displayTitle) === 'Hebrew' ? 'rtl' : 'ltr';

    // פעולות
    const handleAssign = (name) => { 
        onUpdate(article.id, { assignedTo: name, status: 'in_writing', flagged: true, flaggedAt: serverTimestamp() }); 
        setShowAssign(false); 
    };

    const handleFinishWriting = () => { 
        if (!article.hasCountedWriting && user?.displayName) {
            updateUserStats(user.displayName, 'wrote', 1);
            onUpdate(article.id, { status: 'review', assignedTo: null, hasCountedWriting: true }); 
        } else {
            onUpdate(article.id, { status: 'review', assignedTo: null }); 
        }
    };
    
    const toggleField = (field) => {
        const newVal = !article[field];
        onUpdate(article.id, { [field]: newVal });
        if(user?.displayName && newVal) updateUserStats(user.displayName, field, 1);
    };

    const toggleFlag = () => {
        const newVal = !article.flagged;
        onUpdate(article.id, { flagged: newVal, status: newVal ? 'waiting_writing' : 'new', flaggedAt: newVal ? serverTimestamp() : null });
    };

    const saveDocLink = () => {
        onUpdate(article.id, { docLink: docLinkInput });
        setDocLinkMode(false);
    };

    const shareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(`*${displayTitle}*\n\n${article.link}`)}`, '_blank'); };

    // כפתורי סטטוס
    const StatusButtons = () => (
        <div className="flex gap-1 justify-end">
             <button onClick={() => toggleField('translationComplete')} title="סומן כתורגם"
                className={`p-1.5 rounded transition-all ${article.translationComplete ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                <Languages size={14}/>
             </button>
             <button onClick={() => toggleField('publishedSite')} title="פורסם באתר"
                className={`p-1.5 rounded transition-all ${article.publishedSite ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                <Globe size={14}/>
             </button>
             <button onClick={() => toggleField('publishedSocialHe')} title="סושיאל עברית"
                className={`p-1.5 rounded transition-all ${article.publishedSocialHe ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                <Share2 size={14}/>
             </button>
             <button onClick={() => toggleField('publishedSocialEn')} title="סושיאל אנגלית"
                className={`p-1.5 rounded transition-all ${article.publishedSocialEn ? 'bg-pink-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                <span className="text-[10px] font-bold">EN</span>
             </button>
        </div>
    );

    const isImageLoading = showImages && !article.img && !article.isCustom;

    // --- List View (Slim) ---
    if (viewMode === 'list') {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex items-center justify-between gap-3 hover:bg-slate-800 hover:border-slate-600 transition-all group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5 items-center min-w-[40px]">
                        <span className="text-[9px] text-slate-500">{timeSince(article.pubDate)}</span>
                        {article.flaggedAt && !article.publishedSite && <LiveTimer startTime={article.flaggedAt} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 rounded">{article.source}</span>
                             {isTranslating && <span className="text-[9px] text-yellow-500 flex items-center gap-1"><Loader2 size={8} className="animate-spin"/></span>}
                             {article.docLink && <a href={article.docLink} target="_blank" className="text-blue-400"><FileText size={12}/></a>}
                        </div>
                        <a href={article.link} target="_blank" className="font-bold text-sm text-slate-200 hover:text-white truncate block leading-snug" dir={dir}>
                            {displayTitle}
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setShowAssign(!showAssign)} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${article.assignedTo ? 'bg-yellow-500 text-yellow-900' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`} title={article.assignedTo || "שייך"}>
                            {article.assignedTo ? article.assignedTo.charAt(0) : <UserPlus size={12}/>}
                        </button>
                         {showAssign && (
                            <div className="absolute top-full left-0 mt-1 w-28 bg-slate-800 border border-slate-600 rounded shadow-xl z-50">
                                {team.map(m => <button key={m.name} onClick={() => handleAssign(m.name)} className="block w-full text-right px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700">{m.name}</button>)}
                                <button onClick={() => handleAssign(null)} className="block w-full text-right px-2 py-1.5 text-xs text-red-400 hover:bg-slate-700 border-t border-slate-700">בטל</button>
                            </div>
                        )}
                    </div>
                    <StatusButtons />
                    <button onClick={toggleFlag} className={`p-1.5 rounded hover:bg-white/5 ${article.flagged ? 'text-red-500' : 'text-slate-600'}`}>
                        <Flag size={14} fill={article.flagged ? "currentColor" : "none"}/>
                    </button>
                    {article.isCustom && <button onClick={() => onDelete(article.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>}
                </div>
            </div>
        );
    }

    // --- Grid View ---
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col h-full hover:border-slate-600 transition-all group">
            <div className="p-3 flex justify-between items-start border-b border-slate-700/50 bg-slate-900/30">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-[#002366] text-white px-2 py-0.5 rounded shadow-sm">{article.source}</span>
                    {article.originLang && <span className="text-[10px] text-slate-500 uppercase">{article.originLang.substr(0,2)}</span>}
                </div>
                {article.flaggedAt && !article.publishedSite && <LiveTimer startTime={article.flaggedAt} />}
            </div>

            {showImages && (
                <div className="h-32 w-full bg-slate-900 relative overflow-hidden flex-shrink-0">
                    {localImg ? (
                        <img src={localImg} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" onError={() => setLocalImg(null)}/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={24}/></div>
                    )}
                </div>
            )}

            <div className="p-3 flex flex-col flex-1 gap-2">
                {!showImages && (
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-blue-400">{article.source}</span>
                        <span className="text-[10px] text-slate-500">{timeSince(article.pubDate)}</span>
                    </div>
                )}
                
                <a href={article.link} target="_blank" className="font-bold text-sm text-slate-100 leading-snug hover:text-blue-400 transition-colors line-clamp-3" dir={dir}>
                    {displayTitle}
                </a>

                {displaySnippet && !isMobile && (
                    <div className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed" dir={dir}>{displaySnippet}</div>
                )}
                
                <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-slate-700/50">
                    <div className="flex justify-between items-center">
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setShowAssign(!showAssign)} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${article.assignedTo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                                <UserPlus size={12}/> {article.assignedTo || 'שיוך'}
                            </button>
                            {showAssign && (
                                <div className="absolute bottom-full right-0 mb-1 w-32 bg-slate-800 border border-slate-600 rounded shadow-xl z-20">
                                    {team.map(m => <button key={m.name} onClick={() => handleAssign(m.name)} className="block w-full text-right px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700">{m.name}</button>)}
                                    <button onClick={() => handleAssign(null)} className="block w-full text-right px-2 py-1.5 text-xs text-red-400 hover:bg-slate-700 border-t border-slate-700">בטל</button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-2 items-center">
                            <button onClick={() => setDocLinkMode(!docLinkMode)} className={`p-1.5 rounded hover:bg-white/5 ${article.docLink ? 'text-blue-400' : 'text-slate-500'}`}><FileText size={14}/></button>
                            <button onClick={toggleFlag}><Flag size={14} className={article.flagged ? 'text-red-500 fill-current' : 'text-slate-600 hover:text-white'}/></button>
                            {article.isCustom && <button onClick={() => onDelete(article.id)}><Trash2 size={14} className="text-slate-600 hover:text-red-500"/></button>}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <StatusButtons />
                    </div>
                    
                    {article.status === 'in_writing' && article.assignedTo === user?.displayName && (
                        <button onClick={handleFinishWriting} className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 mt-1">
                            <CheckCircle size={10}/> סיימתי לכתוב
                        </button>
                    )}

                    {docLinkMode && (
                        <div className="flex gap-1 mt-1">
                            <input value={docLinkInput} onChange={e=>setDocLinkInput(e.target.value)} placeholder="קישור דוקס" className="flex-1 text-xs bg-black/30 text-white p-1 rounded border border-slate-600"/>
                            <button onClick={saveDocLink} className="text-xs bg-blue-600 px-2 rounded text-white">V</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
