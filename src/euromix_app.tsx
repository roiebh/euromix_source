import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut, 
  updateProfile,
  signInWithCustomToken,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
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
  Flag, FileText, AlertCircle, Loader2, Lightbulb, Clock, Timer, X, Tag, WifiOff, StopCircle, ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================

const getFirebaseConfig = () => {
  try {
    // @ts-ignore
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

// @ts-ignore
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'euromix-pro-v3';
const API_KEY = ""; // Gemini API Key

const ADMIN_EMAILS = ['roiebh@gmail.com'];

const DEFAULT_TEAM = [
  { name: 'דניאל', email: 'daniel@euromix.co.il', role: 'עורך' },
  { name: 'מור', email: 'mor@euromix.co.il', role: 'כתב' },
  { name: 'אבי', email: 'avi@euromix.co.il', role: 'כתב' },
  { name: 'טל', email: 'tal@euromix.co.il', role: 'מנהל סושיאל' },
  { name: 'שחר', email: 'shachar@euromix.co.il', role: 'עורך' }
];

const INITIAL_SOURCES = [
    { name: "Euromix", url: "https://www.euromix.co.il/feed/", type: "website" },
    { name: "Eurovoix", url: "https://eurovoix.com/feed/", type: "website" },
    { name: "Eurovision Fun", url: "https://eurovisionfun.com/feed/", type: "website" },
    { name: "Wiwibloggs", url: "https://wiwibloggs.com/feed/", type: "website" },
    { name: "ESCToday", url: "https://esctoday.com/feed/", type: "website" },
    { name: "ESC Portugal", url: "https://escportugal.pt/feeds/posts/default?alt=rss", type: "website" },
    { name: "Songfestival.be", url: "https://songfestival.be/feed/", type: "website" },
    { name: "Eurovision Spain", url: "https://eurovision-spain.com/feed/", type: "website" },
    { name: "ESC Plus (ES)", url: "https://www.escplus.es/feed/", type: "website" },
    { name: "Eurowizja.org", url: "https://eurowizja.org/feed/", type: "website" },
    { name: "ESCXTRA", url: "https://escxtra.com/feed/", type: "website" },
    { name: "ESCUnited", url: "https://www.escunited.com/feed/", type: "website" },
    { name: "Eurosong.hr", url: "https://eurosong.hr/feed/", type: "website" },
    { name: "Eurovoxx", url: "https://www.eurovoxx.tv/blog-feed.xml", type: "website" },
    { name: "Aussievision", url: "https://www.aussievision.net/blog-feed.xml", type: "website" },
    // Google News Searches
    { name: "News: אירוויזיון", query: "אירוויזיון", type: "search" },
    { name: "News: Eurovision", query: "Eurovision", type: "search" },
    { name: "News: Noa Kirel", query: "Noa Kirel", type: "search" }
];

const FUN_FACTS = [
    "ב-1969 ארבע מדינות זכו בתיקו 🤯",
    "השיר הקצר ביותר: דקה ו-27 שניות (פינלנד 2015) ⏱️",
    "נורווגיה קיבלה 'אפס נקודות' הכי הרבה פעמים (4) 🇳🇴",
    "סלין דיון ייצגה את שווייץ וזכתה. היא בכלל קנדית! 🇨🇦",
    "אוסטרליה באירוויזיון מאז 2015 🇦🇺",
    "לוקסמבורג חזרה ב-2024 אחרי 30 שנה! 🇱🇺",
    "אירלנד ושוודיה הן שיאניות הזכיות (7) 🇮🇪🇸🇪"
];

// ==========================================
// 2. SERVICES
// ==========================================

class NetworkService {
    static proxies = [
        (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, 
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];

    static async delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    static async fetch(url, retries = 1) { 
        for (let attempt = 0; attempt <= retries; attempt++) {
            const shuffled = [...this.proxies].sort(() => 0.5 - Math.random());
            for (const proxyGen of shuffled) {
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 15000);
                    const res = await fetch(proxyGen(url), { signal: controller.signal });
                    clearTimeout(id);
                    
                    if (res.ok) {
                        const data = await res.json(); 
                        if (data && data.contents) return data.contents;
                        const text = await res.text();
                        if (text && text.length > 50) return text;
                    }
                } catch (e) { }
                await this.delay(500);
            }
            await this.delay(1000); 
        }
        return null;
    }
}

class ContentProcessor {
    static detectLanguage(text) {
        if (!text) return 'English';
        const lower = text.toLowerCase();
        if (/[\u0590-\u05FF]/.test(text)) return 'Hebrew';
        if (/[\u0400-\u04FF]/.test(text)) return 'Cyrillic';
        if (/[\u0370-\u03FF]/.test(text)) return 'Greek';
        if (/\b(the|and|is|to|of)\b/.test(lower)) return 'English';
        if (/\b(le|la|les|et|est|pour)\b/.test(lower)) return 'French';
        if (/\b(el|la|los|y|en|por)\b/.test(lower)) return 'Spanish';
        return 'English';
    }
    static async enrich(url) { return { image: null, summary: null, text: null }; }
}

class TranslationService {
    static async translate(text, targetLang) {
        if (!text || text.length < 2) return { text: text || "", lang: "unknown" };
        if (targetLang === 'iw' && /[\u0590-\u05FF]/.test(text)) return { text: text, lang: 'he' };

        if (API_KEY) {
            try {
                const prompt = `Translate to ${targetLang === 'en' ? 'English' : 'Hebrew'}: "${text}". Return JSON: {"translatedText": "..."}`;
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    let jsonText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const json = JSON.parse(jsonText);
                    return { text: json.translatedText, lang: 'detected' };
                }
            } catch(e) {}
        }
        return { text: text, lang: 'error' }; 
    }
}

class ScraperEngine {
    static async getRSSFeed(source) {
        let feedUrl = source.url;
        if (source.type === 'search') {
            feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(source.query)}&hl=en-US&gl=US&ceid=US:en`;
        }

        // 1. rss2json (Primary)
        try {
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok' && data.items) {
                    return data.items.map((item) => {
                        const snippet = (item.description || "").replace(/<[^>]*>?/gm, '').trim();
                        return {
                            source: source.name,
                            title: item.title || "No Title",
                            link: item.link || "#",
                            originLang: ContentProcessor.detectLanguage(item.title),
                            pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                            img: item.thumbnail || item.enclosure?.link || null, 
                            snippet: snippet || "",
                            type: source.type
                        };
                    }).slice(0, 5); 
                }
            }
        } catch(e) {}

        // 2. Fallback XML Parse via Proxy
        try {
            const xmlStr = await NetworkService.fetch(feedUrl);
            if (!xmlStr) return [];
            
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlStr, "text/xml");
            const items = Array.from(xml.querySelectorAll("item"));
            
            return items.map(item => {
                const title = item.querySelector("title")?.textContent || "No Title";
                const link = item.querySelector("link")?.textContent || "#";
                const pubDate = item.querySelector("pubDate")?.textContent;
                let desc = item.querySelector("description")?.textContent || "";
                desc = desc.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
                
                let img = item.querySelector("enclosure")?.getAttribute("url");
                if (!img) {
                    const match = desc.match(/src=["']([^"']+)["']/);
                    if (match) img = match[1];
                }
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = desc;
                const snippet = tempDiv.textContent.substring(0, 150).trim() + "...";

                return {
                    source: source.name,
                    title: title,
                    link: link,
                    originLang: ContentProcessor.detectLanguage(title),
                    pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                    img: img || null, 
                    snippet: snippet,
                    type: source.type
                };
            }).slice(0, 5);
        } catch(e) { return []; }
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
    
    // Future date protection
    if (seconds < 0) return "עכשיו";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}ד'`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}ש'`;
    const days = Math.floor(hours / 24);
    return `${Math.floor(days)}ימ'`;
};

const formatDuration = (seconds) => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}ש ${m}ד`;
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

const LoadingScreen = ({ status, progress, total, onStop, sourceStatuses }) => {
    const [fact, setFact] = useState(FUN_FACTS[0]);
    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

    useEffect(() => {
        setFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
        const interval = setInterval(() => {
            setFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
        }, 5000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#0f172a]/95 z-[200] flex flex-col items-center justify-center p-8 backdrop-blur-md overflow-hidden">
            <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="w-20 h-20 bg-[#002366] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-[#E3000F] shrink-0">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 text-center">{status}</h2>
                
                <div className="w-full bg-slate-700 rounded-full h-4 mb-2 overflow-hidden relative shrink-0">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-[#E3000F] transition-all duration-300 ease-out" style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-slate-400 mb-6 text-sm font-mono flex justify-between px-2 shrink-0">
                    <span>מעבד: {progress} / {total}</span>
                    <span className="font-bold text-white">{percentage}%</span>
                </p>

                <div className="flex-1 overflow-y-auto mb-6 bg-slate-900/50 rounded-xl p-2 border border-slate-700 min-h-0 text-right" dir="rtl">
                    <div className="grid grid-cols-2 gap-2">
                        {sourceStatuses && sourceStatuses.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs p-1">
                                {s.status === 'pending' && <Loader2 size={10} className="animate-spin text-blue-400"/>}
                                {s.status === 'success' && <CheckCircle size={10} className="text-green-500"/>}
                                {s.status === 'error' && <X size={10} className="text-red-500"/>}
                                <span className={`${s.status === 'success' ? 'text-slate-300' : s.status === 'error' ? 'text-red-400' : 'text-slate-500'} truncate`}>
                                    {s.name} {s.count > 0 && `(${s.count})`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 mb-6 shrink-0">
                    <div className="flex items-center justify-center gap-2 mb-2 text-[#E3000F] font-bold uppercase tracking-widest text-xs"><Lightbulb size={14}/> הידעת?</div>
                    <p className="text-sm text-slate-200 font-medium leading-relaxed text-center">"{fact}"</p>
                </div>

                <button onClick={onStop} className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 font-bold text-sm bg-red-900/20 px-4 py-2 rounded-lg mx-auto transition-colors border border-red-900/30 shrink-0">
                    <StopCircle size={16} /> עצור וכנס למערכת
                </button>
            </div>
        </div>
    );
};

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

const SourcesModal = ({ onClose, sources, excluded, onToggle, onAdd }) => {
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');

    return (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-white flex gap-2 items-center"><Layers/> ניהול מקורות</h2>
                
                <div className="flex gap-2 mb-4 bg-slate-900 p-3 rounded-lg" dir="rtl">
                    <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="שם המקור" className="flex-1 p-2 rounded bg-slate-800 border border-slate-600 text-white text-sm"/>
                    <input value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="כתובת RSS" className="flex-[2] p-2 rounded bg-slate-800 border border-slate-600 text-white text-sm" dir="ltr"/>
                    <button onClick={() => { if(newUrl && newName) { onAdd({name: newName, url: newUrl, type: 'website'}); setNewName(''); setNewUrl(''); }}} className="bg-blue-600 text-white px-4 rounded font-bold text-sm">הוסף</button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 pr-2" dir="rtl">
                    {sources.map((s, i) => {
                        const isExcluded = excluded.has(s.name);
                        return (
                            <div key={i} className={`flex justify-between items-center p-3 rounded border ${isExcluded ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-700 border-slate-600 text-white'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button onClick={() => onToggle(s.name)} className={`p-1 rounded-full ${isExcluded ? 'text-slate-600 bg-slate-800' : 'text-green-400 bg-green-900/30'}`}>
                                        {isExcluded ? <EyeOff size={14}/> : <Eye size={14}/>}
                                    </button>
                                    <span className="truncate text-sm font-bold">{s.name}</span>
                                </div>
                                <span className="text-[10px] uppercase bg-slate-900 px-1.5 rounded opacity-70">{s.type}</span>
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
                                        <td className="p-2">{s.publishedSite || 0}</td>
                                        <td className="p-2">{s.publishedSocialHe || 0}</td>
                                        <td className="p-2">{s.publishedSocialEn || 0}</td>
                                        <td className="p-2 text-red-400">{s.returnedCount || 0}</td>
                                        <td className="p-2 text-blue-400">{s.editorReturns || 0}</td>
                                    </tr>
                                );
                            }) : <tr><td colSpan={7} className="p-4 text-center">אין נתונים</td></tr>}
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

const ArticleCard = ({ article, user, showImages, team, viewMode, globalLang, onUpdate, onDelete, isMobile }) => {
    const [localImg, setLocalImg] = useState(article.img || null);
    const [showAssign, setShowAssign] = useState(false);
    const [docLinkMode, setDocLinkMode] = useState(false); 
    const [docLinkInput, setDocLinkInput] = useState(article.docLink || '');
    const [isExpanded, setIsExpanded] = useState(false); 
    const dropdownRef = useRef(null);
    const safeTeam = Array.isArray(team) ? team : [];

    useEffect(() => { if (article.img) setLocalImg(article.img); }, [article.img]);

    let displayTitle = article.title;
    let displaySnippet = article.snippet || '';
    let isTranslating = false;

    if (globalLang === 'he') {
        if (article.titleHe) { displayTitle = article.titleHe; displaySnippet = article.snippetHe || displaySnippet; } else isTranslating = true;
    } else if (globalLang === 'en') {
        if (article.titleEn) { displayTitle = article.titleEn; displaySnippet = article.snippetEn || displaySnippet; } else isTranslating = true;
    } else { displayTitle = article.originalTitle || article.title; }

    const dir = ContentProcessor.detectLanguage(displayTitle) === 'Hebrew' ? 'rtl' : 'ltr';

    const handleAssign = (name) => { 
        onUpdate(article.id, { assignedTo: name, status: 'in_writing', flagged: true, flaggedAt: serverTimestamp() }); 
        setShowAssign(false); 
    };

    const handleFinishWriting = () => { 
        if (!article.hasCountedWriting && user?.displayName) {
            updateUserStats(user.displayName, 'wrote', 1);
            onUpdate(article.id, { status: 'review', assignedTo: null, hasCountedWriting: true }); 
        } else { onUpdate(article.id, { status: 'review', assignedTo: null }); }
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

    const saveDocLink = () => { onUpdate(article.id, { docLink: docLinkInput }); setDocLinkMode(false); };

    const shouldTruncate = displaySnippet.length > 200;
    const displayedSnippet = isExpanded ? displaySnippet : (shouldTruncate ? displaySnippet.substring(0, 200) + "..." : displaySnippet);

    const StatusButtons = () => (
        <div className="flex gap-1 justify-end">
             <button onClick={() => toggleField('translationComplete')} title="סומן כתורגם" className={`p-1.5 rounded transition-all ${article.translationComplete ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Languages size={14}/></button>
             <button onClick={() => toggleField('publishedSite')} title="פורסם באתר" className={`p-1.5 rounded transition-all ${article.publishedSite ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Globe size={14}/></button>
             <button onClick={() => toggleField('publishedSocialHe')} title="סושיאל עברית" className={`p-1.5 rounded transition-all ${article.publishedSocialHe ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Share2 size={14}/></button>
             <button onClick={() => toggleField('publishedSocialEn')} title="סושיאל אנגלית" className={`p-1.5 rounded transition-all ${article.publishedSocialEn ? 'bg-pink-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><span className="text-[10px] font-bold">EN</span></button>
        </div>
    );

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
                        <a href={article.link} target="_blank" className="font-bold text-sm text-slate-200 hover:text-white truncate block leading-snug" dir={dir}>{displayTitle}</a>
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
                </div>
            </div>
        );
    }
    
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
                    {localImg ? <img src={localImg} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" onError={() => setLocalImg(null)}/> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={24}/></div>}
                </div>
            )}
            <div className="p-3 flex flex-col flex-1 gap-2">
                {!showImages && (
                    <div className="flex justify-between items-start"><span className="text-[10px] font-bold text-blue-400">{article.source}</span><span className="text-[10px] text-slate-500">{timeSince(article.pubDate)}</span></div>
                )}
                <a href={article.link} target="_blank" className="font-bold text-sm text-slate-100 leading-snug hover:text-blue-400 transition-colors line-clamp-3" dir={dir}>{displayTitle}</a>
                
                {/* READ MORE SNIPPET */}
                {displaySnippet && !isMobile && (
                    <div className="text-[11px] text-slate-400 leading-relaxed" dir={dir}>
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
                        </div>
                    </div>
                    <div className="flex justify-between items-center"><StatusButtons /></div>
                    {article.status === 'in_writing' && article.assignedTo === user?.displayName && (
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
  
  const [showImages, setShowImages] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); 
  const [isMobile, setIsMobile] = useState(false);
  const [globalViewLang, setGlobalViewLang] = useState('he'); 
  
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); 
  const [scanProgress, setScanProgress] = useState(0); 
  const [scanTotal, setScanTotal] = useState(0); 
  const [enhanceProgress, setEnhanceProgress] = useState(0);
  const [enhanceTotal, setEnhanceTotal] = useState(0);
  const [sourceStatuses, setSourceStatuses] = useState([]); 

  const [liveSearch, setLiveSearch] = useState('');
  const [activeTags, setActiveTags] = useState([]); 
  const [tagInput, setTagInput] = useState(''); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [filterLast24h, setFilterLast24h] = useState(false); 
  const [groupSources, setGroupSources] = useState(false); 
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false); 
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false); 
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [userProfileInput, setUserProfileInput] = useState({ name: '', role: 'כתב' });

  // State for source management
  const [sourcesList, setSourcesList] = useState(INITIAL_SOURCES);
  const [excludedSources, setExcludedSources] = useState(new Set());

  // Load excluded sources from local storage
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

  const handleAddSource = (newSrc) => {
      setSourcesList(prev => [...prev, newSrc]);
  };

  const handleAddTag = (e) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          setActiveTags([...activeTags, tagInput.trim()]);
          setTagInput('');
      }
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

  // Admin Check
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
      if(!user || !db) return;
      const unsubArticles = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'articles'), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          setArticles(list);
          setLoading(false);
      });
      const unsubConfig = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), (snap) => {
          if (snap.exists()) {
             const data = snap.data();
             setTeam(Array.isArray(data.team) ? data.team : DEFAULT_TEAM);
             if (data.customSources) {
                 setSourcesList([...INITIAL_SOURCES, ...data.customSources]);
             }
          } else { setTeam(DEFAULT_TEAM); }
      });
      return () => { unsubArticles(); unsubConfig(); };
  }, [user]);

  const handleUpdateProfile = async (newName) => {
    if (!user || !newName) return;
    try {
        await updateProfile(user, { displayName: newName });
        const newTeam = team.map((m) => m.email === user.email ? { ...m, name: newName } : m);
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { team: newTeam }, { merge: true });
        setShowEditProfile(false);
    } catch(e) { alert("Failed to update profile"); }
  };

  const handleGoogleLogin = async () => {
      if(!auth) return;
      try { 
        await signInWithPopup(auth, new GoogleAuthProvider()); 
      } catch(e) {
         if (e.code === 'auth/popup-blocked') alert("Popup blocked.");
      }
  };

  const handleUpdateTeam = async (newTeam) => {
      setTeam(newTeam);
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { team: newTeam }, { merge: true });
  };

  // Add custom source to DB
  const handleAddCustomSource = async (newSrc) => {
      const currentCustom = sourcesList.filter(s => !INITIAL_SOURCES.find(i => i.name === s.name));
      const updatedCustom = [...currentCustom, newSrc];
      setSourcesList(prev => [...prev, newSrc]);
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { customSources: updatedCustom }, { merge: true });
  };

  const runScan = async () => {
    if(scanning || !db) return;
    setScanning(true);
    setScanStatus("מתחיל סריקה...");
    setScanProgress(0);
    
    // Filter out excluded sources from scan
    const activeSources = sourcesList.filter(s => !excludedSources.has(s.name));
    
    // Interleave sources (Website, Search, Website, Search...)
    const websites = activeSources.filter(s => s.type === 'website');
    const searches = activeSources.filter(s => s.type === 'search');
    const interleaved = [];
    const maxLen = Math.max(websites.length, searches.length);
    for (let i = 0; i < maxLen; i++) {
        if (i < websites.length) interleaved.push(websites[i]);
        if (i < searches.length) interleaved.push(searches[i]);
    }
    
    setScanTotal(interleaved.length);
    
    const initStatuses = interleaved.map(s => ({ name: s.name, status: 'pending', count: 0 }));
    setSourceStatuses(initStatuses);
    
    const batchSize = 3; // Very small batch to avoid 429
    let allResults = [];
    let completed = 0;

    for(let i = 0; i < interleaved.length; i += batchSize) {
        const batch = interleaved.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (src, idx) => {
            const items = await ScraperEngine.getRSSFeed(src);
            setSourceStatuses(prev => prev.map(s => 
                s.name === src.name ? { ...s, status: items.length > 0 ? 'success' : 'error', count: items.length } : s
            ));
            return items;
        });

        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((res) => {
            if(res.status === 'fulfilled') allResults.push(...res.value);
        });
        
        completed += batch.length;
        setScanProgress(Math.min(completed, interleaved.length));
        await new Promise(r => setTimeout(r, 2000)); // Long delay
    }

    setScanStatus(`נמצאו ${allResults.length} כתבות... מסנכרן...`);
    
    if (allResults.length > 0) {
        // @ts-ignore
        const existingLinks = new Set(articles.map(a => a.link));
        // @ts-ignore
        const newItems = allResults.filter(item => !existingLinks.has(item.link));
        
        if (newItems.length > 0) {
            let batch = writeBatch(db); 
            let count = 0;
            for (let i = 0; i < newItems.length; i++) {
                const newRef = doc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'articles'));
                batch.set(newRef, {
                    ...newItems[i], createdAt: serverTimestamp(), status: 'new', flagged: false, 
                    publishedSite: false, publishedSocialHe: false, publishedSocialEn: false, translationComplete: false,
                    assignedTo: null, isCustom: false, hasCountedWriting: false
                });
                count++;
                if (count >= 400) { await batch.commit(); batch = writeBatch(db); count = 0; }
            }
            if (count > 0) await batch.commit();
        }
    }
    setScanning(false);
  };

  // Helper for 24h filter - Improved
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
        // Excluded source filter
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
        else if (filterStatus === 'published') statusMatch = a.publishedSite === true;
        
        else if (filterStatus === 'wait_site') statusMatch = (a.status === 'review') && !a.publishedSite;
        else if (filterStatus === 'wait_trans') statusMatch = a.flagged && !a.translationComplete;
        
        else if (filterStatus === 'wait_social_he') statusMatch = (a.status === 'review') && !a.publishedSocialHe;
        else if (filterStatus === 'wait_social_en') statusMatch = (a.status === 'review') && !a.publishedSocialEn;
        
        else if (filterStatus === 'mytasks') statusMatch = user?.displayName && a.assignedTo === user.displayName;

        // 24H Filter
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
      published: articles.filter(a => a.publishedSite).length,
      wait_trans: articles.filter(a => a.flagged && !a.translationComplete).length,
      mytasks: user?.displayName ? articles.filter(a => a.assignedTo === user.displayName).length : 0
  };
  
  const sourcesStats = useMemo(() => {
      const stats = {};
      sourcesList.forEach(s => stats[s.name] = 0);
      articles.forEach(a => { if(a.source) stats[a.source] = (stats[a.source] || 0) + 1; });
      return Object.entries(stats).sort((a,b) => b[1] - a[1]);
  }, [articles, sourcesList]);

  if (loading) return <LoadingScreen status="טוען מערכת..." progress={0} total={0} onStop={() => setLoading(false)} sourceStatuses={[]} />;

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
        {/* Progress Bar */}
        {enhanceTotal > 0 && enhanceProgress < enhanceTotal && (
             <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-[300]">
                 <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{width: `${(enhanceProgress/enhanceTotal)*100}%`}}></div>
             </div>
        )}
        
        {/* Modals */}
        {showTeamModal && <TeamModal onClose={()=>setShowTeamModal(false)} team={team} onUpdateTeam={handleUpdateTeam} />}
        {showEditProfile && user && <EditProfileModal onClose={() => setShowEditProfile(false)} user={user} onSave={handleUpdateProfile} />}
        {showSourcesModal && <SourcesModal onClose={() => setShowSourcesModal(false)} sources={sourcesList} excluded={excludedSources} onToggle={handleToggleSource} onAdd={handleAddCustomSource} />}
        {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} team={team} user={user} />}
        {showTaskModal && <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"><div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6"><input value={manualTitle} onChange={e=>setManualTitle(e.target.value)} placeholder="כותרת" className="w-full mb-4 p-2 bg-slate-900 text-white rounded border border-slate-600"/><button onClick={addManualTask} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">הוסף</button><button onClick={()=>setShowTaskModal(false)} className="w-full mt-2 text-slate-400 hover:text-white">ביטול</button></div></div>}
        {scanning && <LoadingScreen status={scanStatus} progress={scanProgress} total={scanTotal} onStop={() => setScanning(false)} sourceStatuses={sourceStatuses} />}

        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-l border-slate-700 flex flex-col shadow-xl z-20 bg-slate-900">
                <div className="p-6 border-b border-slate-700 flex flex-col items-center gap-3 relative">
                    <img 
                        src="https://drive.google.com/uc?export=view&id=16V5BKcxFQgVraCviXK1o5k5VD31ztjTD" 
                        alt="EuroMix Logo" 
                        referrerPolicy="no-referrer"
                        className="h-16 w-auto mb-2 drop-shadow-lg object-contain"
                        onError={(e) => {
                             e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div className="text-2xl font-black text-white">מרכז <span className="text-red-500">המקורות</span></div>
                    
                    {user && (
                         <div className="flex flex-col items-center gap-2 mt-2">
                             {user.photoURL ? (
                                 <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border-2 border-slate-600" />
                             ) : (
                                 <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold">{user.displayName ? user.displayName[0] : 'U'}</div>
                             )}
                             <div className="flex items-center gap-2">
                                <div className="text-sm font-bold truncate text-slate-300">{user.displayName || 'אורח'}</div>
                                <button onClick={() => setShowEditProfile(true)} className="text-slate-500 hover:text-white"><Edit2 size={12}/></button>
                             </div>
                         </div>
                    )}
                    
                    {(!user || user.isAnonymous) && (
                        <button onClick={handleGoogleLogin} className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-slate-900 py-2 rounded font-bold text-xs hover:bg-slate-200 transition-colors">
                           <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            התחבר עם גוגל
                        </button>
                    )}
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    <div>
                        <div className="text-xs font-bold text-slate-500 px-2 mb-2 uppercase">כללי</div>
                        <button onClick={() => setFilterStatus('all')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                            <span>כל הכתבות</span>
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">{filterLast24h ? filtered.length : counts.all}</span>
                        </button>
                        <button onClick={() => setFilterStatus('mytasks')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='mytasks' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>המשימות שלי</span><span>{counts.mytasks}</span></button>
                    </div>

                    <div>
                        <div className="text-xs font-bold text-slate-500 px-2 mb-2 uppercase">תור עבודה</div>
                        <button onClick={() => setFilterStatus('wait_trans')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm mb-1 ${filterStatus==='wait_trans' ? 'bg-blue-900/30 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>לתרגום</span><span className="bg-blue-900/50 px-2 py-0.5 rounded text-xs">{counts.wait_trans}</span></button>
                        <button onClick={() => setFilterStatus('waiting_writing')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm mb-1 ${filterStatus==='waiting_writing' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>ממתין לכתיבה</span><span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">{counts.waiting_writing}</span></button>
                        <button onClick={() => setFilterStatus('in_writing')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm mb-1 ${filterStatus==='in_writing' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>בכתיבה</span><span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">{counts.in_writing}</span></button>
                        <button onClick={() => setFilterStatus('review')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='review' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>ממתין לטיפול</span><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">{counts.review}</span></button>
                        <button onClick={() => setFilterStatus('published')} className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${filterStatus==='published' ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:bg-slate-800/50'}`}><span>פורסם</span><span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">{counts.published}</span></button>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-700 flex flex-col gap-2">
                     {/* Admin Controls - Visible if roiebh@gmail.com */}
                     {isAdmin && (
                         <>
                             <button onClick={() => setShowTeamModal(true)} className="w-full text-xs text-slate-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800"><Users size={14}/> ניהול צוות</button>
                             <button onClick={() => setShowStatsModal(true)} className="w-full text-xs text-slate-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800"><BarChart2 size={14}/> סטטיסטיקות</button>
                         </>
                     )}
                     <button onClick={() => setShowSourcesModal(true)} className="w-full text-xs text-slate-400 hover:text-white py-2 rounded flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800"><Layers size={14}/> ניהול מקורות</button>
                     <button onClick={resetDatabase} className="w-full text-xs text-red-500 hover:bg-red-500/10 py-2 rounded flex items-center justify-center gap-2 border border-red-500/30"><RotateCcw size={12}/> איפוס מסד נתונים</button>
                     <button onClick={() => auth && signOut(auth)} className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center justify-center gap-1 mt-2"><LogOut size={14}/> יציאה</button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-900">
                {/* Header */}
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
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                         <div className="bg-slate-800 rounded-lg p-1 border border-slate-700 flex">
                             {['he', 'en', 'org'].map(l => (
                                 <button key={l} onClick={() => setGlobalViewLang(l)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${globalViewLang === l ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{l === 'he' ? 'עברית' : l === 'en' ? 'EN' : 'מקור'}</button>
                             ))}
                         </div>
                         <button onClick={() => setFilterLast24h(!filterLast24h)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${filterLast24h ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}><Calendar size={14}/> 24H</button>
                         <button onClick={() => setGroupSources(!groupSources)} className={`p-2 rounded-lg border transition-all ${groupSources ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}><Group size={16}/></button>
                         <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-2 rounded-lg border bg-slate-800 text-slate-400 border-slate-700 hover:text-white"><LayoutList size={16}/></button>
                         <button onClick={() => setShowImages(!showImages)} className={`p-2 rounded-lg border transition-all ${showImages ? 'bg-green-600 text-white border-green-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}><ImageIcon size={16}/></button>
                         <button id="scan-btn" onClick={runScan} disabled={scanning} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white text-xs shadow-lg transition-all ${scanning ? 'bg-slate-600' : 'bg-[#E3000F] hover:bg-red-600'}`}><RefreshCw size={14} className={scanning ? 'animate-spin' : ''}/> {scanning ? 'סורק...' : 'סנכרון'}</button>
                         <button onClick={() => setShowTaskModal(true)} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg"><Plus size={16}/></button>
                    </div>
                </div>

                {/* Tags Display */}
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