import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  setDoc, 
  getDocs, 
  writeBatch, 
  increment, 
  updateDoc, 
  deleteDoc, 
  addDoc
} from 'firebase/firestore';
import { 
  Search, RefreshCw, Layers, BarChart2, RotateCcw, Sun, LogOut, 
  Calendar, Group, LayoutList, ImageIcon, Plus, HelpCircle, Users, 
  CheckCircle, Share2, Globe, Languages, Edit2, ExternalLink, Trash2,
  Flag, FileText, AlertCircle, Loader2, Lightbulb, Clock, Timer, X, Tag, WifiOff, StopCircle, ChevronDown, ChevronUp, Eye, Undo2 as ReturnIcon, Activity, MessageCircle, Archive, Link as LinkIcon, RefreshCcw, Settings, Play, Server
} from 'lucide-react';

// ==========================================
// 1. CONFIGURATION
// ==========================================

// --- הגדרות GITHUB להפעלה מרחוק ---
const GITHUB_TOKEN = "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"; // <--- שים כאן את ה-Token שלך (ghp_...)
const GITHUB_OWNER = "roiebh"; // השם משתמש שלך
const GITHUB_REPO = "euromix_source"; // שם הפרויקט

const getFirebaseConfig = () => {
  try {
    if (typeof __firebase_config !== 'undefined') return JSON.parse(__firebase_config);
  } catch (e) { console.error("Firebase config parsing error", e); }
  
  return {
    apiKey: "AIzaSyDnhd5rhKYpryYe5XqkeCeKFehXJWJa1cg",
    authDomain: "euromix-sources.firebaseapp.com",
    projectId: "euromix-sources",
    storageBucket: "euromix-sources.firebasestorage.app",
    messagingSenderId: "125861053780",
    appId: "1:125861053780:web:11810b2596041e98f174c1",
    measurementId: "G-D5R5KXG86H"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

if (auth) {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
}

const APP_ID = 'euromix-pro-v3';
// מפתח Gemini (אם יש לך, הכנס כאן. אם לא, החלק של הסיכום לא יעבוד)
const API_KEY = ""; 

const ADMIN_EMAILS = ['roiebh@gmail.com'];

const DEFAULT_TEAM = [
  { name: 'דניאל', email: 'daniel@euromix.co.il', role: 'עורך' },
  { name: 'מור', email: 'mor@euromix.co.il', role: 'כתב' },
  { name: 'אבי', email: 'avi@euromix.co.il', role: 'כתב' },
  { name: 'טל', email: 'tal@euromix.co.il', role: 'מנהל סושיאל' },
  { name: 'שחר', email: 'shachar@euromix.co.il', role: 'עורך' }
];

// ==========================================
// 2. SERVICES
// ==========================================

class NetworkService {
    static proxies = [
        (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, 
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    ];

    static async fetch(url) { 
        const shuffled = [...this.proxies].sort(() => 0.5 - Math.random());
        for (const proxyGen of shuffled) {
            try {
                const res = await fetch(proxyGen(url));
                if (res.ok) {
                    const data = await res.json(); 
                    if (data && data.contents) return data.contents;
                    return JSON.stringify(data);
                }
            } catch (e) { }
        }
        return null;
    }
}

class ContentProcessor {
    static detectLanguage(text) {
        if (!text) return 'English';
        const lower = text.toLowerCase();
        if (/[\u0590-\u05FF]/.test(text)) return 'Hebrew';
        if (/\b(the|and|is|to|of)\b/.test(lower)) return 'English';
        return 'English';
    }
    
    // פונקציה שמורידה את ה-HTML ומנסה לחלץ טקסט
    static async fetchContent(url) {
        try {
            const html = await NetworkService.fetch(url);
            if (!html) return null;
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            // ניסיון לחלץ תמונה
            let image = null;
            const ogImage = doc.querySelector('meta[property="og:image"]');
            if (ogImage) image = ogImage.content;
            
            // ניסיון לחלץ טקסט (פשוט לוקחים את כל ה-P)
            const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.innerText).join('\n');
            const cleanText = paragraphs.substring(0, 5000); // הגבלה כדי לא להעמיס על ה-API

            return { image, text: cleanText };
        } catch (e) {
            return null;
        }
    }
}

class AIManager {
    static async processArticle(title, content) {
        if (!API_KEY) return null;
        
        try {
            // פרומפט מתוחכם ל-Gemini
            const prompt = `
            You are a Eurovision news editor.
            Task:
            1. Translate the title "${title}" to Hebrew (titleHe) and English (titleEn).
            2. Summarize the following article content into a short paragraph in Hebrew (summaryHe) and English (summaryEn).
            
            Article Content:
            "${content}"

            Return ONLY JSON:
            {
                "titleHe": "...",
                "titleEn": "...",
                "summaryHe": "...",
                "summaryEn": "..."
            }
            `;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            if (response.ok) {
                const data = await response.json();
                let jsonText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonText);
            }
        } catch(e) {
            console.error("AI Error:", e);
        }
        return null;
    }
}

// ==========================================
// 3. UI COMPONENTS
// ==========================================

const timeSince = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
    if (seconds < 0) return "עכשיו";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `לפני ${minutes} דק'`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    const days = Math.floor(hours / 24);
    return `לפני ${Math.floor(days)} ימים`;
};

const updateUserStats = async (userName, field, delta) => {
    if (!userName || !db) return;
    try {
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'stats');
        await updateDoc(statsRef, { [`${userName}.${field}`]: increment(delta) });
    } catch (e) {
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'stats');
        try { await setDoc(statsRef, { [userName]: { [field]: delta } }, { merge: true }); } catch(e2) {}
    }
};

const incrementArticleView = async (articleId) => {
    if (!articleId || !db) return;
    const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'articles', articleId);
    await updateDoc(ref, { views: increment(1) }).catch(e=>{});
};

const LiveTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!startTime) return;
        const start = startTime.seconds ? new Date(startTime.seconds * 1000) : new Date(startTime);
        const update = () => {
            const now = new Date();
            setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
        };
        update();
        const interval = setInterval(update, 1000); 
        return () => clearInterval(interval);
    }, [startTime]);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const formattedTime = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return (
        <div className="bg-red-100/90 text-red-700 px-2 py-0.5 rounded-md font-bold shadow text-[11px] flex items-center gap-1 border border-red-200 mt-1 w-fit min-w-[60px] justify-center">
            <Timer size={12}/>
            <span>{formattedTime}</span>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="fixed inset-0 bg-[#0f172a] z-[200] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <h2 className="text-white font-bold">טוען מערכת...</h2>
    </div>
);

const TeamModal = ({ onClose, team, onUpdateTeam }) => {
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('כתב');
    const [editingIndex, setEditingIndex] = useState(-1);
    const safeTeam = Array.isArray(team) ? team : [];
    
    const handleSave = () => {
        let updated = [...safeTeam];
        if (editingIndex >= 0) { updated[editingIndex] = { ...updated[editingIndex], name: newName, role: newRole }; } 
        else { updated.push({ name: newName, email: '', role: newRole }); }
        onUpdateTeam(updated);
        setNewName(''); setEditingIndex(-1);
    };

    const handleRemove = (index) => {
        const updated = safeTeam.filter((_, i) => i !== index);
        onUpdateTeam(updated);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-700" onClick={e=>e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Users/> ניהול צוות</h2>
                <div className="flex gap-2 mb-6" dir="rtl">
                    <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="שם חבר צוות" className="flex-1 p-2 rounded border bg-slate-700 border-slate-600 text-white"/>
                    <select value={newRole} onChange={e=>setNewRole(e.target.value)} className="p-2 rounded border bg-slate-700 border-slate-600 text-white">
                        <option>כתב</option><option>עורך</option><option>מנהל סושיאל</option>
                    </select>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 rounded font-bold">{editingIndex >= 0 ? 'עדכן' : 'הוסף'}</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto" dir="rtl">
                    {safeTeam.map((m, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-slate-700 rounded border border-slate-600">
                            <span className="text-white font-bold">{m.name} <span className="text-xs font-normal opacity-70">({m.role})</span></span>
                            <div className="flex gap-2">
                                <button onClick={() => {setEditingIndex(i); setNewName(m.name); setNewRole(m.role)}} className="text-blue-400 p-1"><Edit2 size={14}/></button>
                                <button onClick={() => handleRemove(i)} className="text-red-500 p-1"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full py-2 bg-slate-600 hover:bg-slate-500 text-white rounded font-bold">סגור</button>
            </div>
        </div>
    );
};

const SourcesModal = ({ onClose, counts, excluded, onToggle, scanWindow, onUpdateScanWindow, allAvailableSources }) => {
    const sources = allAvailableSources || [];

    return (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex gap-2 items-center"><Layers/> ניהול מקורות וסינון</h2>
                </div>
                
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-600 mb-6 flex flex-col gap-3">
                    <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-2"><Settings size={14}/> הגדרות תצוגה</h3>
                    <div className="flex items-center gap-4">
                        <label className="text-slate-400 text-xs">הצג כתבות מ-X שעות אחרונות:</label>
                        <input 
                            type="number" 
                            value={scanWindow} 
                            onChange={(e) => onUpdateScanWindow(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-600 rounded p-1 text-white w-20 text-center text-sm"
                            min="1"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 pr-2" dir="rtl">
                    {sources.map((s, i) => {
                        const isExcluded = excluded.has(s);
                        const count = counts[s] || 0; 
                        
                        return (
                            <div key={i} className={`flex justify-between items-center p-3 rounded border ${isExcluded ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-700 border-slate-600 text-white'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <input 
                                        type="checkbox" 
                                        checked={!isExcluded} 
                                        onChange={() => onToggle(s)}
                                        className="w-4 h-4 accent-green-500 cursor-pointer rounded"
                                    />
                                    <span className="truncate text-sm font-bold">{s}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="text-xs text-slate-400 font-mono">{count}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={onClose} className="mt-4 w-full py-2 bg-slate-600 hover:bg-slate-500 text-white rounded font-bold">סגור</button>
            </div>
        </div>
    );
};

const StatsModal = ({ onClose, team, user }) => {
    const [stats, setStats] = useState({});
    useEffect(() => {
        if (!user || !db) return;
        const unsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'stats'), (snap) => {
            if(snap.exists()) setStats(snap.data());
        }, (err) => {}); 
        return () => unsub();
    }, [user]);

    const safeTeam = Array.isArray(team) ? team : [];

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
                                <th className="p-2">תורגם</th>
                                <th className="p-2">אתר</th>
                                <th className="p-2">סוש. עברית</th>
                                <th className="p-2">סוש. אנגלית</th>
                                <th className="p-2 text-red-500">החזרות (קיבל)</th>
                                <th className="p-2 text-blue-500">החזרות (ביצע)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeTeam.length > 0 ? safeTeam.map((member) => {
                                const s = stats[member.name] || {};
                                return (
                                    <tr key={member.name} className="border-b dark:border-slate-700 dark:text-slate-300">
                                        <td className="p-2 font-bold">{member.name}</td>
                                        <td className="p-2">{s.wrote || 0}</td>
                                        <td className="p-2">{s.translated || 0}</td>
                                        <td className="p-2">{s.publishedSite || 0}</td>
                                        <td className="p-2">{s.publishedSocialHe || 0}</td>
                                        <td className="p-2">{s.publishedSocialEn || 0}</td>
                                        <td className="p-2 text-red-400">{s.returnedCount || 0}</td>
                                        <td className="p-2 text-blue-400">{s.editorReturns || 0}</td>
                                    </tr>
                                );
                            }) : <tr><td colSpan={8} className="p-4 text-center">אין נתונים</td></tr>}
                        </tbody>
                    </table>
                </div>
                <button onClick={onClose} className="mt-8 w-full bg-slate-200 dark:bg-slate-700 py-3 rounded-xl font-bold dark:text-white">סגור</button>
            </div>
        </div>
    );
};

const EditProfileModal = ({ onClose, user, onSave }) => {
    const [name, setName] = useState(user.displayName || '');
    return (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 p-8 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-700" onClick={e=>e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Edit2 size={20}/> עריכת פרופיל</h2>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">שם תצוגה</label>
                        <input 
                            value={name} 
                            onChange={e=>setName(e.target.value)} 
                            className="w-full p-2 rounded border bg-slate-900 border-slate-600 text-white"
                        />
                    </div>
                    <button onClick={() => onSave(name)} className="bg-blue-600 text-white py-2 rounded font-bold mt-2">שמור</button>
                    <button onClick={onClose} className="text-slate-400 text-sm">ביטול</button>
                </div>
            </div>
        </div>
    );
};

const ArticleCard = ({ article, user, showImages, team, viewMode, globalLang, onUpdate, onDelete, isMobile, isAdmin }) => {
    const safeTeam = Array.isArray(team) ? team : [];
    const [localImg, setLocalImg] = useState(article.img || null);
    const [showAssign, setShowAssign] = useState(false);
    const [docLinkMode, setDocLinkMode] = useState(false); 
    const [docLinkInput, setDocLinkInput] = useState(article.docLink || '');
    const [isExpanded, setIsExpanded] = useState(false); 
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [waLoading, setWaLoading] = useState(false);
    const dropdownRef = useRef(null);

    // תצוגת תקציר: עדיפות לתרגום, אחרת מקור
    let snippetDisplay = article.snippet;
    if (globalLang === 'he' && article.snippetHe) snippetDisplay = article.snippetHe;
    if (globalLang === 'en' && article.snippetEn) snippetDisplay = article.snippetEn;

    const shouldTruncate = snippetDisplay?.length > 250;
    const displayedSnippet = isExpanded ? snippetDisplay : (shouldTruncate ? snippetDisplay.substring(0, 250) + "..." : snippetDisplay);

    useEffect(() => { if (article.img) setLocalImg(article.img); }, [article.img]);

    let displayTitle = article.title;
    if (globalLang === 'he' && article.titleHe) displayTitle = article.titleHe;
    else if (globalLang === 'en' && article.titleEn) displayTitle = article.titleEn;

    const dir = (globalLang === 'he' || ContentProcessor.detectLanguage(displayTitle) === 'he') ? 'rtl' : 'ltr';
    const align = dir === 'rtl' ? 'text-right' : 'text-left';

    const handleAssign = (name) => { 
        if (name) {
             onUpdate(article.id, { assignedTo: name, status: 'in_writing', flagged: true, flaggedAt: serverTimestamp(), isReturned: false }); 
        } else {
             onUpdate(article.id, { assignedTo: null, status: article.flagged ? 'waiting_writing' : 'new' }); 
        }
        setShowAssign(false); 
    };

    const handleFinishWriting = () => { 
        if (!article.hasCountedWriting && user?.displayName) {
            updateUserStats(user.displayName, 'wrote', 1);
            onUpdate(article.id, { status: 'review', hasCountedWriting: true });
        } else { onUpdate(article.id, { status: 'review' }); }
    };
    
    const handleReturnToWriter = () => {
         if (article.assignedTo) {
             updateUserStats(article.assignedTo, 'wrote', -1);
             updateUserStats(article.assignedTo, 'returnedCount', 1);
             if(user?.displayName) updateUserStats(user.displayName, 'editorReturns', 1);
         }
         onUpdate(article.id, { 
             status: 'in_writing', 
             flagged: true, // מחזיר את הדגל
             isReturned: true, 
             hasCountedWriting: false 
         });
    };

    const toggleField = (field) => {
        const newVal = !article[field];
        const updates = { [field]: newVal };
        if (user?.displayName) {
             let statField = null;
             if (field === 'translationComplete') statField = 'translated';
             else if (field === 'publishedSite') statField = 'publishedSite';
             else if (field === 'publishedSocialHe') statField = 'publishedSocialHe';
             else if (field === 'publishedSocialEn') statField = 'publishedSocialEn';
             if (statField) updateUserStats(user.displayName, statField, newVal ? 1 : -1);
        }
        const isAllDone = (
            (field === 'publishedSite' ? newVal : article.publishedSite) &&
            (field === 'publishedSocialHe' ? newVal : article.publishedSocialHe) &&
            (field === 'publishedSocialEn' ? newVal : article.publishedSocialEn) &&
            (field === 'translationComplete' ? newVal : article.translationComplete)
        );
        if (isAllDone) { updates.status = 'published'; updates.flagged = false; }
        else if (article.status === 'published' && !newVal) { updates.status = 'review'; }
        
        onUpdate(article.id, updates);
    };
    
    const handleArchive = () => {
        // אם כבר בארכיון - החזר לטיפול
        if (article.status === 'archived') {
            onUpdate(article.id, { status: 'review', flagged: false });
        } else {
            onUpdate(article.id, { status: 'archived', flagged: false });
        }
    };

    const toggleFlag = () => {
        const newVal = !article.flagged;
        onUpdate(article.id, { flagged: newVal, status: newVal ? 'waiting_writing' : 'new', flaggedAt: newVal ? serverTimestamp() : null });
    };
    
    const handleLinkClick = () => {
        incrementArticleView(article.id);
    };

    // --- הפונקציה החדשה והחכמה לניתוח תוכן וסיכום ---
    const handleRefresh = async () => {
        setIsRefreshing(true);
        onUpdate(article.id, { processing: true });
        
        try {
            // 1. הורדת תוכן הכתבה
            const contentData = await ContentProcessor.fetchContent(article.link);
            const updates = {};

            if (contentData) {
                // עדכון תמונה אם נמצאה טובה יותר
                if (contentData.image && !article.img) {
                    updates.img = contentData.image;
                    setLocalImg(contentData.image);
                }

                // 2. שליחה ל-Gemini לתרגום וסיכום
                if (API_KEY && contentData.text) {
                    const aiResult = await AIManager.processArticle(article.title, contentData.text);
                    if (aiResult) {
                        updates.titleHe = aiResult.titleHe;
                        updates.titleEn = aiResult.titleEn;
                        updates.snippetHe = aiResult.summaryHe;
                        updates.snippetEn = aiResult.summaryEn;
                    }
                }
            }
            
            updates.processing = false;
            onUpdate(article.id, updates);

        } catch(e) {
            console.error(e);
            onUpdate(article.id, { processing: false });
        }
        setIsRefreshing(false);
    };

    const shareWhatsApp = async () => {
        const titleToShare = article.titleHe || article.title;
        const snippetToShare = article.snippetHe || article.snippet;
        const text = `*${titleToShare}*\n\n${snippetToShare || ''}\n\n${article.link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const saveDocLink = () => { onUpdate(article.id, { docLink: docLinkInput }); setDocLinkMode(false); };
    const isAssignedToMe = user && article.assignedTo === user.displayName;

    const StatusButtons = () => (
        <div className="flex gap-1 justify-end items-center">
             <button onClick={() => toggleField('translationComplete')} title="תורגם ע״י הכתב" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.translationComplete ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Languages size={14}/></button>
             <button onClick={() => toggleField('publishedSite')} title="כתבה פורסמה" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.publishedSite ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Globe size={14}/></button>
             <button onClick={() => toggleField('publishedSocialHe')} title="סושיאל עברית" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.publishedSocialHe ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Share2 size={14}/></button>
             <button onClick={() => toggleField('publishedSocialEn')} title="סושיאל אנגלית" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.publishedSocialEn ? 'bg-pink-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><span className="text-[10px] font-bold">EN</span></button>
             
             <button onClick={handleArchive} title={article.status === 'archived' ? 'בטל ארכיון' : 'ארכב (סיים)'} className={`p-1.5 rounded ml-1 w-7 h-7 flex items-center justify-center border ${article.status === 'archived' ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-800 text-slate-500 hover:text-white border-slate-600'}`}>
                 {article.status === 'archived' ? <ReturnIcon size={12}/> : <Archive size={12}/>}
             </button>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <div className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex items-center justify-between gap-3 hover:bg-slate-800 hover:border-slate-600 transition-all group ${article.isReturned ? 'border-yellow-500/50 bg-yellow-900/10' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5 items-center min-w-[40px]">
                        <span className="text-[9px] text-slate-500 whitespace-nowrap">{timeSince(article.pubDate)}</span>
                        {article.flaggedAt && !article.publishedSite && <LiveTimer startTime={article.flaggedAt} />}
                        <span className="text-[9px] uppercase font-bold text-slate-600 bg-slate-900 px-1 rounded">{article.originLang || 'EN'}</span>
                        {article.isReturned && <span className="text-[8px] text-yellow-500 font-bold">הוחזר</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 rounded">{article.source}</span>
                             <button onClick={shareWhatsApp} title="שתף בוואטסאפ" className="p-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30">
                                 <MessageCircle size={10}/>
                             </button>
                             <button onClick={handleRefresh} title="רענן וסכם ב-AI" className="p-1 rounded bg-slate-700 text-slate-400 hover:text-white">
                                 {isRefreshing ? <Loader2 size={10} className="animate-spin"/> : <RefreshCw size={10}/>}
                             </button>
                             {article.docLink && <a href={article.docLink} target="_blank" className="text-blue-400"><FileText size={12}/></a>}
                             {article.views > 0 && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Eye size={10}/> {article.views}</span>}
                        </div>
                        <a href={article.link} target="_blank" onClick={handleLinkClick} className={`font-bold text-sm text-slate-200 hover:text-white truncate block leading-snug ${align}`} dir={dir}>{displayTitle}</a>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setShowAssign(!showAssign)} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${article.assignedTo ? 'bg-yellow-500 text-yellow-900' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`} title={article.assignedTo || "שייך"}>
                            {article.assignedTo ? article.assignedTo.charAt(0) : <Users size={12}/>}
                        </button>
                         {showAssign && (
                            <div className="absolute top-full left-0 mt-1 w-28 bg-slate-800 border border-slate-600 rounded shadow-xl z-50">
                                {safeTeam.map((m) => <button key={m.name} onClick={() => handleAssign(m.name)} className="block w-full text-right px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700">{m.name}</button>)}
                                <button onClick={() => handleAssign(null)} className="block w-full text-right px-2 py-1.5 text-xs text-red-400 hover:bg-slate-700 border-t border-slate-700">בטל</button>
                            </div>
                        )}
                    </div>
                    <StatusButtons />
                    <button onClick={toggleFlag} className={`p-1.5 rounded hover:bg-white/5 ${article.flagged ? 'text-red-500' : 'text-slate-600'}`}><Flag size={14} fill={article.flagged ? "currentColor" : "none"}/></button>
                    {article.isCustom && <button onClick={() => onDelete(article.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>}
                    {isAdmin && article.status === 'review' && (
                        <button onClick={handleReturnToWriter} title="החזר לכתב" className="text-yellow-500 hover:bg-yellow-500/20 p-1.5 rounded"><ReturnIcon size={14}/></button>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className={`bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col h-full hover:border-slate-600 transition-all group ${article.isReturned ? 'border-yellow-500/40' : ''}`}>
            <div className="p-3 flex justify-between items-start border-b border-slate-700/50 bg-slate-900/30">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-[#002366] text-white px-2 py-0.5 rounded shadow-sm">{article.source}</span>
                    <button onClick={shareWhatsApp} title="שתף בוואטסאפ" className="p-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30">
                         <MessageCircle size={12}/>
                    </button>
                    <button onClick={handleRefresh} title="רענן וסכם ב-AI" className="p-1 rounded bg-slate-700 text-slate-400 hover:text-white">
                         {isRefreshing ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
                    </button>
                    {article.isReturned && <span className="text-[10px] bg-yellow-900/50 text-yellow-500 px-1.5 rounded border border-yellow-500/30">הוחזר לתיקון</span>}
                </div>
                <div className="flex items-center gap-2">
                    {article.views > 0 && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Eye size={10}/> {article.views}</span>}
                    {article.flaggedAt && !article.publishedSite && <LiveTimer startTime={article.flaggedAt} />}
                </div>
            </div>
            {showImages && (
                <div className="h-32 w-full bg-slate-900 relative overflow-hidden flex-shrink-0">
                    {localImg ? <img src={localImg} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" onError={() => setLocalImg(null)}/> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={24}/></div>}
                </div>
            )}
            <div className="p-3 flex flex-col flex-1 gap-2">
                {!showImages && (
                    <div className="flex justify-between items-start"><span className="text-[10px] font-bold text-blue-400">{article.source}</span><span className="text-[10px] text-slate-500 whitespace-nowrap">{timeSince(article.pubDate)}</span></div>
                )}
                <a href={article.link} target="_blank" onClick={handleLinkClick} className={`font-bold text-sm text-slate-100 leading-snug hover:text-blue-400 transition-colors ${align}`} dir={dir}>{displayTitle}</a>
                
                {snippetDisplay && !isMobile && (
                    <div className={`text-[11px] text-slate-400 leading-relaxed ${align}`} dir={dir}>
                        {displayedSnippet}
                        {shouldTruncate && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)} 
                                className="text-blue-400 hover:text-blue-300 font-bold ml-1 text-[10px] flex items-center gap-0.5 inline-flex"
                            >
                                {isExpanded ? <span>הסתר <ChevronUp size={10}/></span> : <span>קרא עוד <ChevronDown size={10}/></span>}
                            </button>
                        )}
                    </div>
                )}

                <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-slate-700/50">
                    <div className="flex justify-between items-center">
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setShowAssign(!showAssign)} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${article.assignedTo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'text-slate-500 hover:text-slate-300'}`}><Users size={12}/> {article.assignedTo || 'שיוך'}</button>
                            {showAssign && (
                                <div className="absolute bottom-full right-0 mb-1 w-32 bg-slate-800 border border-slate-600 rounded shadow-xl z-20">
                                    {safeTeam.map((m) => <button key={m.name} onClick={() => handleAssign(m.name)} className="block w-full text-right px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700">{m.name}</button>)}
                                    <button onClick={() => handleAssign(null)} className="block w-full text-right px-2 py-1.5 text-xs text-red-400 hover:bg-slate-700 border-t border-slate-700">בטל</button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => setDocLinkMode(!docLinkMode)} className={`p-1.5 rounded hover:bg-white/5 ${article.docLink ? 'text-blue-400' : 'text-slate-500'}`}><FileText size={14}/></button>
                            <button onClick={toggleFlag}><Flag size={14} className={article.flagged ? 'text-red-500 fill-current' : 'text-slate-600 hover:text-white'}/></button>
                            {article.isCustom && <button onClick={() => onDelete(article.id)}><Trash2 size={14} className="text-slate-600 hover:text-red-500"/></button>}
                            {isAdmin && article.status === 'review' && (
                                <button onClick={handleReturnToWriter} title="החזר לכתב" className="text-yellow-500 hover:bg-yellow-500/20 p-1.5 rounded"><ReturnIcon size={14}/></button>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center"><StatusButtons /></div>
                    
                    {isAssignedToMe && (article.status === 'in_writing' || article.isReturned) && (
                        <button onClick={handleFinishWriting} className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 mt-1"><CheckCircle size={10}/> סיימתי לכתוב</button>
                    )}
                    
                    {docLinkMode && (
                        <div className="flex gap-1 mt-1"><input value={docLinkInput} onChange={e=>setDocLinkInput(e.target.value)} placeholder="קישור דוקס" className="flex-1 text-xs bg-black/30 text-white p-1 rounded border border-slate-600"/><button onClick={saveDocLink} className="text-xs bg-blue-600 px-2 rounded text-white">V</button></div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN APP COMPONENT
// ==========================================

export default function EuroMixSystem() {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [scanWindow, setScanWindow] = useState(9999); // ברירת מחדל: ללא הגבלה
  const [lastScrapeTime, setLastScrapeTime] = useState(null);
  const [triggerLoading, setTriggerLoading] = useState(false);
  
  const [showImages, setShowImages] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); 
  const [isMobile, setIsMobile] = useState(false);
  const [globalViewLang, setGlobalViewLang] = useState('he'); 
  
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  const [liveSearch, setLiveSearch] = useState('');
  const [activeTags, setActiveTags] = useState([]); 
  const [tagInput, setTagInput] = useState(''); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [filterLast24h, setFilterLast24h] = useState(false); 
  const [groupSources, setGroupSources] = useState(false); 
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false); 
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualLink, setManualLink] = useState('');

  const [excludedSources, setExcludedSources] = useState(new Set());

  useEffect(() => {
      const stored = localStorage.getItem('excluded_sources');
      if (stored) {
          try { setExcludedSources(new Set(JSON.parse(stored))); } catch(e) {}
      }
  }, []);

  const handleToggleSource = (name) => {
      const newSet = new Set(excludedSources);
      if (newSet.has(name)) newSet.delete(name);
      else newSet.add(name);
      setExcludedSources(newSet);
      localStorage.setItem('excluded_sources', JSON.stringify([...newSet]));
  };
  
  const handleUpdateScanWindow = (hours) => {
      setScanWindow(hours);
  };

  const handleAddTag = (e) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          setActiveTags([...activeTags, tagInput.trim()]);
          setTagInput('');
      }
  };

  const handleTriggerScraper = async () => {
      if (!GITHUB_TOKEN) {
          alert("חסר GitHub Token בקוד. לא ניתן להפעיל מרחוק.");
          return;
      }
      setTriggerLoading(true);
      try {
          const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/scrape.yml/dispatches`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${GITHUB_TOKEN}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ref: 'main' })
          });
          
          if (res.ok) {
              alert("הפקודה נשלחה בהצלחה! הסריקה תתחיל תוך דקה.");
          } else {
              alert("שגיאה בשליחת הפקודה לגיטהאב.");
          }
      } catch (e) {
          console.error(e);
          alert("שגיאת תקשורת.");
      }
      setTriggerLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { if(loading) setLoading(false); }, 6000);
    const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false); 
    });
    return () => { clearTimeout(timer); unsub(); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
      if(!user || !db) return;
      const unsubArticles = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'articles'), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const now = new Date();
          // סינון לפי חלון זמן (אם לא מוגדר כ-9999)
          const filteredList = list.filter(a => scanWindow > 1000 ? true : (now - new Date(a.pubDate)) < scanWindow * 60 * 60 * 1000);
          
          filteredList.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          setArticles(filteredList);
          setLoading(false);
      });
      const unsubConfig = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), (snap) => {
          if (snap.exists()) {
              const data = snap.data();
              setTeam(Array.isArray(data.team) ? data.team : DEFAULT_TEAM);
          } else { setTeam(DEFAULT_TEAM); }
      });
      
      const unsubStatus = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'status'), (snap) => {
          if (snap.exists()) {
              const data = snap.data();
              if (data.lastScrape) {
                  setLastScrapeTime(new Date(data.lastScrape.seconds * 1000));
              }
          }
      });

      return () => { unsubArticles(); unsubConfig(); unsubStatus(); };
  }, [user, scanWindow]);

  const handleUpdateProfile = async (newName) => {
    if (!user || !newName) return;
    try {
        await updateProfile(user, { displayName: newName });
        const newTeam = team.map((m) => m.email === user.email ? { ...m, name: newName } : m);
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { team: newTeam }, { merge: true });
        setShowEditProfile(false);
    } catch(e) { alert("Failed to update profile"); }
  };

  const handleUpdateTeam = async (newTeam) => {
      setTeam(newTeam);
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { team: newTeam }, { merge: true });
  };
  
  const addManualTask = async () => {
      if(!manualTitle || !db) return;
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'articles'), {
          title: manualTitle, link: manualLink || `manual:${Date.now()}`, source: 'משימה ידנית',
          pubDate: new Date().toISOString(), snippet: 'משימה שנוספה ידנית', createdAt: serverTimestamp(),
          status: 'waiting_writing', flagged: true, flaggedAt: serverTimestamp(),
          publishedSite: false, publishedSocialHe: false, publishedSocialEn: false, translationComplete: false,
          assignedTo: null, isCustom: true, originLang: 'Hebrew', hasCountedWriting: false
      });
      setManualTitle(''); setManualLink(''); setShowTaskModal(false);
  };
  
  const handleGlobalRefresh = async () => {
      setIsGlobalRefreshing(true);
      const batch = writeBatch(db);
      let count = 0;
      filtered.forEach(a => {
          if (!a.isCustom) {
              const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'articles', a.id);
              batch.update(ref, { processing: false, translationComplete: false });
              count++;
          }
      });
      if (count > 0) await batch.commit();
      setTimeout(() => setIsGlobalRefreshing(false), 2000);
  };

  const isLast24Hours = (dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      return (now.getTime() - d.getTime()) < 24 * 60 * 60 * 1000; 
  };

  const resetDatabase = async () => {
      if(!db) return;
      if (!confirm("למחוק הכל?")) return;
      try {
          const snapshot = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'articles'));
          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
      } catch(e) {}
  };

  const filtered = useMemo(() => {
    return articles.filter(a => {
        if (excludedSources.has(a.source)) return false;

        const textMatch = !liveSearch || (a.title + (a.source || '')).toLowerCase().includes(liveSearch.toLowerCase());
        
        let tagMatch = true;
        if (activeTags.length > 0) {
            const content = (a.title + (a.snippet || '')).toLowerCase();
            tagMatch = activeTags.some(tag => content.includes(tag.toLowerCase()));
        }

        let statusMatch = true;
        if (filterStatus === 'waiting_writing') statusMatch = a.status === 'waiting_writing';
        else if (filterStatus === 'in_writing') statusMatch = a.status === 'in_writing';
        else if (filterStatus === 'review') statusMatch = a.status === 'review'; 
        else if (filterStatus === 'published') statusMatch = (a.status === 'published' || a.status === 'archived');
        
        else if (filterStatus === 'wait_site') statusMatch = (a.status === 'review') && !a.publishedSite;
        else if (filterStatus === 'wait_trans') statusMatch = a.flagged && !a.translationComplete;
        
        else if (filterStatus === 'wait_social_he') statusMatch = (a.status === 'review') && !a.publishedSocialHe;
        else if (filterStatus === 'wait_social_en') statusMatch = (a.status === 'review') && !a.publishedSocialEn;
        
        else if (filterStatus === 'mytasks') {
            if (!user?.displayName || a.assignedTo !== user.displayName) return false;
            if (a.status === 'review' && !a.isReturned) return false;
            return true;
        }

        if (filterLast24h && !isLast24Hours(a.pubDate)) return false;

        return textMatch && statusMatch && tagMatch;
    });
  }, [articles, liveSearch, filterStatus, user, activeTags, filterLast24h, excludedSources]);

  const groupedArticles = useMemo(() => {
      const g = {};
      filtered.forEach(a => { if(!g[a.source]) g[a.source] = []; g[a.source].push(a); });
      return g;
  }, [filtered]);

  const counts = {
      all: articles.length,
      waiting_writing: articles.filter(a => a.status === 'waiting_writing').length,
      in_writing: articles.filter(a => a.status === 'in_writing').length,
      review: articles.filter(a => a.status === 'review').length,
      published: articles.filter(a => a.status === 'published' || a.status === 'archived').length,
      wait_trans: articles.filter(a => a.flagged && !a.translationComplete).length,
      mytasks: user?.displayName ? articles.filter(a => a.assignedTo === user.displayName && (a.status === 'in_writing' || a.isReturned)).length : 0
  };
  
  const allAvailableSources = useMemo(() => {
      const sources = new Set(articles.map(a => a.source).filter(Boolean));
      return Array.from(sources).sort();
  }, [articles]);

  const sourcesStats = useMemo(() => {
      const stats = {};
      articles.forEach(a => { if(a.source) stats[a.source] = (stats[a.source] || 0) + 1; });
      return stats;
  }, [articles]);

  if (loading) return <LoadingScreen />;

  if (!auth && !loading) {
      return (
         <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white gap-4">
             <WifiOff size={48} className="text-red-500"/>
             <h2 className="text-xl font-bold">שגיאת התחברות לשרת</h2>
             <p>לא ניתן היה לטעון את הגדרות המערכת. ייתכן והמפתחות חסרים.</p>
         </div>
      );
  }

  return (
    <div className="min-h-screen font-sans bg-slate-900 text-slate-100" dir="rtl">
        {showTeamModal && <TeamModal onClose={()=>setShowTeamModal(false)} team={team} onUpdateTeam={handleUpdateTeam} />}
        {showEditProfile && user && <EditProfileModal onClose={() => setShowEditProfile(false)} user={user} onSave={handleUpdateProfile} />}
        {showSourcesModal && <SourcesModal onClose={() => setShowSourcesModal(false)} counts={sourcesStats} excluded={excludedSources} onToggle={handleToggleSource} scanWindow={scanWindow} onUpdateScanWindow={handleUpdateScanWindow} allAvailableSources={allAvailableSources} />}
        {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} team={team} user={user} />}
        {showTaskModal && <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"><div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6"><h3 className="text-white font-bold mb-4">הוסף משימה ידנית</h3><input value={manualTitle} onChange={e=>setManualTitle(e.target.value)} placeholder="כותרת" className="w-full mb-4 p-2 bg-slate-900 text-white rounded border border-slate-600"/><div className="flex items-center gap-2 mb-4 bg-slate-900 rounded border border-slate-600 p-1"><LinkIcon size={16} className="text-slate-500 ml-2"/><input value={manualLink} onChange={e=>setManualLink(e.target.value)} placeholder="קישור למקור (אופציונלי)" className="flex-1 bg-transparent text-white outline-none text-sm" dir="ltr"/></div><button onClick={addManualTask} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">הוסף</button><button onClick={()=>setShowTaskModal(false)} className="w-full mt-2 text-slate-400 hover:text-white">ביטול</button></div></div>}

        <div className="flex h-screen overflow-hidden">
            <aside className="w-64 flex-shrink-0 border-l border-slate-700 flex flex-col shadow-xl z-20 bg-slate-900">
                <div className="p-6 border-b border-slate-700 flex flex-col items-center gap-3 relative">
                    <img 
                        src="https://drive.google.com/uc?export=view&id=16V5BKcxFQgVraCviXK1o5k5VD31ztjTD" 
                        alt="EuroMix Logo" 
                        referrerPolicy="no-referrer"
                        className="h-16 w-auto mb-2 drop-shadow-lg object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="text-2xl font-black text-white relative">
                        מרכז <span className="text-red-500">המקורות</span>
                    </div>
                    {/* תצוגת זמן ריצה אחרון */}
                    {lastScrapeTime && (
                        <div className="text-[10px] text-slate-500 mt-[-5px]">
                            עודכן: {lastScrapeTime.toLocaleTimeString()} {lastScrapeTime.toLocaleDateString()}
                        </div>
                    )}
                    
                    {user && (
                         <div className="flex flex-col items-center gap-2 mt-2">
                             <div className="flex items-center gap-2">
                                 <div className="text-sm font-bold truncate text-slate-300">{user.displayName || 'אורח'}</div>
                                 <button onClick={() => setShowEditProfile(true)} className="text-slate-500 hover:text-white"><Edit2 size={12}/></button>
                             </div>
                         </div>
                    )}
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    <div>
                        <div className="text-xs font-bold text-slate-500 px-2 mb-2 uppercase">כללי</div>
                        <button onClick={() => setFilterStatus('all')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                            <span>כל הכתבות</span>
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">{filterLast24h ? filtered.length : counts.all} ({(filterStatus === 'all' && (liveSearch || activeTags.length > 0 || filterLast24h)) ? filtered.length : counts.all})</span>
                        </button>
                        <button onClick={() => setFilterStatus('mytasks')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='mytasks' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>המשימות שלי</span><span>{counts.mytasks}</span></button>
                    </div>

                    <div>
                        <div className="text-xs font-bold text-slate-500 px-2 mb-2 uppercase">תור עבודה</div>
                        <button onClick={() => setFilterStatus('waiting_writing')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm mb-1 ${filterStatus==='waiting_writing' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>ממתין לכתיבה</span><span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">{counts.waiting_writing}</span></button>
                        <button onClick={() => setFilterStatus('in_writing')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm mb-1 ${filterStatus==='in_writing' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>בכתיבה</span><span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">{counts.in_writing}</span></button>
                        <button onClick={() => setFilterStatus('review')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='review' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>ממתין לטיפול</span><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">{counts.review}</span></button>
                        <button onClick={() => setFilterStatus('published')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='published' ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>פורסם</span><span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">{counts.published}</span></button>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-700 flex flex-col gap-2">
                     {/* כפתור הפעלה מרחוק */}
                     <button onClick={handleTriggerScraper} className="w-full text-xs text-orange-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 border border-orange-500/30 hover:bg-orange-500/20">
                         {triggerLoading ? <Loader2 size={14} className="animate-spin"/> : <Play size={14}/>} 
                         הפעל סריקה עכשיו
                     </button>

                     {isAdmin && (
                         <>
                             <button onClick={() => setShowTeamModal(true)} className="w-full text-xs text-slate-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800"><Users size={14}/> ניהול צוות</button>
                             <button onClick={() => setShowStatsModal(true)} className="w-full text-xs text-slate-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800"><BarChart2 size={14}/> סטטיסטיקות</button>
                         </>
                     )}
                     <button onClick={() => setShowSourcesModal(true)} className="w-full text-xs text-slate-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800"><Layers size={14}/> ניהול מקורות</button>
                     <button onClick={() => auth && signOut(auth)} className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center justify-center gap-1 mt-2"><LogOut size={14}/> יציאה</button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-900">
                <div className="h-16 px-6 py-3 flex items-center justify-between border-b border-slate-700 bg-slate-900/90 backdrop-blur z-10">
                    <div className="flex-1 flex gap-3 min-w-[300px]">
                        <div className="relative flex-1 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <input value={liveSearch} onChange={e => setLiveSearch(e.target.value)} placeholder="חיפוש מהיר..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"/>
                            </div>
                            <div className="relative w-48">
                                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <input 
                                    value={tagInput} 
                                    onChange={e => setTagInput(e.target.value)} 
                                    onKeyDown={handleAddTag}
                                    placeholder="סינון תגיות..." 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <button 
                                onClick={() => setFilterLast24h(!filterLast24h)} 
                                className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${filterLast24h ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                                title="הצג כתבות מ-24 שעות אחרונות"
                            >
                                <Clock size={18}/>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                         <div className="bg-slate-800 rounded-lg p-1 border border-slate-700 flex">
                             {['he', 'en', 'org'].map(l => (
                                 <button key={l} onClick={() => setGlobalViewLang(l)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${globalViewLang === l ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{l === 'he' ? 'עברית' : l === 'en' ? 'EN' : 'מקור'}</button>
                             ))}
                         </div>
                         <button onClick={() => setGroupSources(!groupSources)} className={`p-2 rounded-lg border transition-all ${groupSources ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}><Group size={16}/></button>
                         <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-2 rounded-lg border bg-slate-800 text-slate-400 border-slate-700 hover:text-white"><LayoutList size={16}/></button>
                         <button onClick={() => setShowImages(!showImages)} className={`p-2 rounded-lg border transition-all ${showImages ? 'bg-green-600 text-white border-green-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}><ImageIcon size={16}/></button>
                         <button onClick={handleGlobalRefresh} className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 shadow-lg" title="רענן הכל"><RefreshCcw size={16} className={isGlobalRefreshing ? 'animate-spin' : ''}/></button>
                         <button onClick={() => setShowTaskModal(true)} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg"><Plus size={16}/></button>
                    </div>
                </div>

                {activeTags.length > 0 && (
                    <div className="px-6 py-2 flex gap-2 flex-wrap">
                        {activeTags.map(tag => (
                            <span key={tag} className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded-lg text-xs flex items-center gap-1 border border-blue-800">
                                {tag} <button onClick={() => setActiveTags(activeTags.filter(t => t !== tag))}><X size={12}/></button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    {groupSources ? (
                        Object.keys(groupedArticles).map(source => (
                            <div key={source} className="mb-8">
                                <h3 className="text-xl font-bold mb-4 px-2 border-r-4 border-[#E3000F] text-white">{source} <span className="text-sm font-normal opacity-60">({groupedArticles[source].length})</span></h3>
                                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" : "flex flex-col gap-3"}>
                                    {groupedArticles[source].map((article) => (
                                        <ArticleCard 
                                            key={article.id} article={article} user={user} darkMode={true} showImages={showImages} team={team} 
                                            viewMode={viewMode} globalLang={globalViewLang} isMobile={isMobile}
                                            onUpdate={(id, data) => db && updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'articles', id), data)} 
                                            onDelete={(id) => db && deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'articles', id))} 
                                            isAdmin={isAdmin}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" : "flex flex-col gap-3"}>
                            {filtered.map(article => (
                                <ArticleCard 
                                    key={article.id} article={article} user={user} darkMode={true} showImages={showImages} team={team} 
                                    viewMode={viewMode} globalLang={globalViewLang} isMobile={isMobile}
                                    onUpdate={(id, data) => db && updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'articles', id), data)} 
                                    onDelete={(id) => db && deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'articles', id))} 
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}