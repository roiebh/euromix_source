import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
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
  Flag, FileText, AlertCircle, Loader2, Lightbulb, Clock, Timer, X, Tag, WifiOff, StopCircle, ChevronDown, ChevronUp, Eye, EyeOff, RotateCcw as ReturnIcon, Activity, MessageCircle, Wand2, Archive, Link as LinkIcon, Terminal, RefreshCcw, Settings, UploadCloud
} from 'lucide-react';

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================

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

// --- המקורות הוסרו מהקוד ועברו למסד נתונים ---
// המשתנה הזה נשמר ריק כברירת מחדל
const INITIAL_SOURCES = []; 

// רשימת המקורות המלאה (רק לצורך כפתור האתחול החד פעמי)
const SEED_SOURCES_LIST = [
    { name: "Google Alert - site:srgsse.ch", url: "https://rss.app/feeds/XmrR7FDGjjJjsLth.xml", type: "website" },
    { name: "Google Alert - site:eurovoix.com", url: "https://rss.app/feeds/iFQuiE4YoaS70Bsx.xml", type: "website" },
    { name: "Google Alert – site:eurovisionfun.com", url: "https://eurovisionfun.com/feed/", type: "website" },
    { name: "Eurovision.tv", url: "https://rssgenerator.mooo.com/feeds/?p=aaHR0cHM6Ly9ldXJvdmlzaW9uLnR2Lw==", type: "website" },
    { name: "Wiwibloggs.com", url: "https://wiwibloggs.com/feed/", type: "website" },
    { name: "Esctoday.com", url: "https://esctoday.com/feed/", type: "website" },
    { name: "Escportugal.pt", url: "https://www.escportugal.pt/feeds/posts/default?alt=rss", type: "website" },
    { name: "Songfestival.be", url: "https://songfestival.be/feed/", type: "website" },
    { name: "Ogaegreece.com", url: "https://ogaegreece.com/feed/", type: "website" },
    { name: "Eurofestivalnews.com", url: "https://www.eurofestivalnews.com/feed/", type: "website" },
    { name: "Eurovision-spain.com", url: "https://eurovision-spain.com/feed", type: "website" },
    { name: "Escplus.es", url: "https://www.escplus.es/feed/", type: "website" },
    { name: "Eurofestivales.blogspot.com", url: "https://eurofestivales.blogspot.com/feeds/posts/default?alt=rss", type: "website" },
    { name: "Eurowizja.org", url: "https://eurowizja.org/feed", type: "website" },
    { name: "Eurovision.de", url: "https://rss.app/feeds/8aQtfmiwBt4ce87g.xml", type: "website" },
    { name: "Eurosong.dk", url: "https://www.google.com/alerts/feeds/15835567105207766825/12981302875322281890", type: "website" },
    { name: "Thateurovisionsite.com", url: "https://thateurovisionsite.com/feed/", type: "website" },
    { name: "Escxtra.com", url: "https://escxtra.com//feed/", type: "website" },
    { name: "Escunited.com", url: "https://www.escunited.com/feed/", type: "website" },
    { name: "Dziennik-eurowizyjny.pl", url: "https://dziennik-eurowizyjny.pl/feed/", type: "website" },
    { name: "Escnorge.no", url: "https://escnorge.no/feed/", type: "website" },
    { name: "Esc-kompakt.de", url: "https://esc-kompakt.de/feed/", type: "website" },
    { name: "Vadeeurovision.es", url: "https://vadeeurovision.es/feed/", type: "website" },
    { name: "Euroalfa.eu", url: "https://euroalfa.eu/feed/", type: "website" },
    { name: "Eurosong.hr", url: "https://eurosong.hr/feed/", type: "website" },
    { name: "Escbeat.com", url: "https://escbeat.com/feed/", type: "website" },
    { name: "Escbubble.com", url: "https://escbubble.com/feed/", type: "website" },
    { name: "Eurovoxx.tv", url: "https://eurovoxx.tv/feed/", type: "website" },
    { name: "Eurovision-contest.ru", url: "https://eurovision-contest.ru/feed/", type: "website" },
    { name: "Eurovision-quotidien.com", url: "https://eurovision-quotidien.com/feed/", type: "website" },
    { name: "Eurovision.tvr.ro", url: "https://rss.app/feeds/uQxLPbFk92GSxlPG.xml", type: "website" },
    { name: "Evrovizija.com", url: "https://evrovizija.com/feed/", type: "website" },
    { name: "Aussievision.net", url: "https://www.aussievision.net/blog-feed.xml", type: "website" },
    { name: "אירוויזיון", url: "https://www.google.com/alerts/feeds/15835567105207766825/5473716720584096141", type: "website" },
    { name: "Eurovision", url: "https://www.google.com/alerts/feeds/15835567105207766825/16734694345916095083", type: "website" },
    { name: "Евровидение", url: "https://www.google.com/alerts/feeds/15835567105207766825/13669486295274188151", type: "website" },
    { name: "Евровидения", url: "https://www.google.com/alerts/feeds/15835567105207766825/13164718255631459023", type: "website" },
    { name: "Еўрабачанне", url: "https://www.google.com/alerts/feeds/15835567105207766825/17262529628428332060", type: "website" },
    { name: "Евровизије", url: "https://www.google.com/alerts/feeds/15835567105207766825/11425745387878122567", type: "website" },
    { name: "Евровизия", url: "https://www.google.com/alerts/feeds/15835567105207766825/7969999045049038384", type: "website" },
    { name: "Eirovīzijas", url: "https://www.google.com/alerts/feeds/15835567105207766825/7686022273118167199", type: "website" },
    { name: "Eurovizijoje", url: "https://www.google.com/alerts/feeds/15835567105207766825/17418799624831186251", type: "website" },
    { name: "Eurovíziós", url: "https://www.google.com/alerts/feeds/15835567105207766825/9276029416140084921", type: "website" },
    { name: "Eurowizji", url: "https://www.google.com/alerts/feeds/15835567105207766825/8937318266706503768", type: "website" },
    { name: "Eurovisión", url: "https://www.google.com/alerts/feeds/15835567105207766825/5768382838368422062", type: "website" },
    { name: "Eurovisió", url: "https://www.google.com/alerts/feeds/15835567105207766825/6665331610851128851", type: "website" },
    { name: "Eurovisão", url: "https://www.google.com/alerts/feeds/15835567105207766825/6073672349489065697", type: "website" },
    { name: "Евровизија", url: "https://www.google.com/alerts/feeds/15835567105207766825/12504643566802910413", type: "website" },
    { name: "Avroviziya", url: "https://www.google.com/alerts/feeds/15835567105207766825/5229535975056204060", type: "website" },
    { name: "Eurovisiooni", url: "https://www.google.com/alerts/feeds/15835567105207766825/6489150213567016703", type: "website" },
    { name: "Eurovisioonil", url: "https://www.google.com/alerts/feeds/15835567105207766825/1180767461695683410", type: "website" },
    { name: "Evrovizije", url: "https://www.google.com/alerts/feeds/15835567105207766825/836375354746867643", type: "website" },
    { name: "eurosongu", url: "https://www.google.com/alerts/feeds/15835567105207766825/6708471790519134431", type: "website" },
    { name: "eurosonga", url: "https://www.google.com/alerts/feeds/15835567105207766825/2511188842940626316", type: "website" },
    { name: "Euroviziji", url: "https://www.google.com/alerts/feeds/15835567105207766825/8117892362414115022", type: "website" },
    { name: "Eurovizi", url: "https://www.google.com/alerts/feeds/15835567105207766825/15615812334629122465", type: "website" },
    { name: "Eurovizioni", url: "https://www.google.com/alerts/feeds/15835567105207766825/5615330509302177194", type: "website" },
    { name: "Eurovisiesongfestival", url: "https://www.google.com/alerts/feeds/15835567105207766825/15780802084620737192", type: "website" },
    { name: "Söngvakeppni", url: "https://www.google.com/alerts/feeds/15835567105207766825/15423983244498170540", type: "website" },
    { name: "Եվրատեսիլ", url: "https://www.google.com/alerts/feeds/15835567105207766825/15099035478425700531", type: "website" },
    { name: "ევროვიზიის", url: "https://www.google.com/alerts/feeds/15835567105207766825/14407299024310346891", type: "website" },
    { name: "مسابقة يوروفيجن الأوروبية", url: "https://www.google.com/alerts/feeds/15835567105207766825/2150643630344992794", type: "website" },
    { name: "أوروفيزيون", url: "https://www.google.com/alerts/feeds/15835567105207766825/1913102588284681727", type: "website" },
    { name: "\"eurovision\" \"Zvicra\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/600578587183424385", type: "website" },
    { name: "\"Shqipëria\" \"Eurovizion\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/5270168749846509977", type: "website" },
    { name: "\"eurovision\" \"norge\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/10258311237790315460", type: "website" },
    { name: "\"eurovision\" \"sverige\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/7471694817148723592", type: "website" },
    { name: "\"eurovision\" \"romania\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/13469247121030984786", type: "website" },
    { name: "\"eurovision\" \"united kingdom\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/5521115869083766938", type: "website" },
    { name: "\"eurovision\" \"australia\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/15462106606358024819", type: "website" },
    { name: "\"eurovision\" \"ireland\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/4939101851014900767", type: "website" },
    { name: "\"Österreich\" \"Eurovision\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/7841272026805120970", type: "website" },
    { name: "Белоруссии Евровидение", url: "https://www.google.com/alerts/feeds/15835567105207766825/138718906201805591", type: "website" },
    { name: "\"Belgique\" \"l'Eurovision\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/1734480943282004171", type: "website" },
    { name: "\"België\" \"songfestival\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/18149203235573798037", type: "website" },
    { name: "Евровидение Молдова", url: "https://www.google.com/alerts/feeds/15835567105207766825/4171072731871609982", type: "website" },
    { name: "eurosongu bosna", url: "https://www.google.com/alerts/feeds/15835567105207766825/4854044355477788333", type: "website" },
    { name: "hrvatska eurosong", url: "https://www.google.com/alerts/feeds/15835567105207766825/15551386491322919916", type: "website" },
    { name: "Κύπρος Eurovision", url: "https://www.google.com/alerts/feeds/15835567105207766825/826679917683776817", type: "website" },
    { name: "Ελλάδα Eurovision", url: "https://www.google.com/alerts/feeds/15835567105207766825/3752359685739993463", type: "website" },
    { name: "\"France\" \"l'Eurovision\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/4702931870982455282", type: "website" },
    { name: "Deutschland eurovision", url: "https://www.google.com/alerts/feeds/15835567105207766825/5024685657597218016", type: "website" },
    { name: "italia \"l'eurovision\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/5825472544868778374", type: "website" },
    { name: "malta fil-Eurovision", url: "https://www.google.com/alerts/feeds/15835567105207766825/17366842103016854853", type: "website" },
    { name: "România Eurovision", url: "https://www.google.com/alerts/feeds/15835567105207766825/14327067969509063538", type: "website" },
    { name: "slovenija evroviziji", url: "https://www.google.com/alerts/feeds/15835567105207766825/10446842549172419926", type: "website" },
    { name: "\"Türkiye\" \"Eurovision\"", url: "https://www.google.com/alerts/feeds/15835567105207766825/14086237475371258259", type: "website" },
    { name: "Euromix.co.il", url: "https://www.google.co.il/alerts/feeds/15835567105207766825/7628706936256400347", type: "website" },
    { name: "ניסיון פיד ישיר EUROMIX", url: "https://www.euromix.co.il/feed/", type: "website" },
    { name: "eurovoix.com", url: "https://eurovoix.com/feed/", type: "website" },
    { name: "Eurovision.tv (RSS.app)", url: "https://rss.app/feeds/Ajogi3ZKuKozFIT6.xml", type: "website" }
];

const FUN_FACTS = [
    "הסמי-פיינל גורם לאירופה לגלות מחדש גיאוגרפיה: “רגע, המדינה הזאת קיימת?”.",
    "לפעמים הזוכה הוא מי שהיה הכי “נכון לרגע” ולא בהכרח מי שהיה הכי “מושלם טכנית”.",
    "יש שירים שמקבלים חיים שניים בטיקטוק שנים אחרי—כי העולם אוהב קאמבקים מוזרים.",
    "ברגע שמתחילים הניקודים, כולם הופכים לשופטי על עם תיאוריה למה זה “מכור/גאוני/מביך”.",
    "בכל אירוויזיון יש לפחות שיר אחד שגורם לך לשאול: “זה מבריק או שאני פשוט עייף?”.",
    "אין עוד תחרות שבה לבוש כסוף, לבוש זהב ולבוש “דיסקו-אסטרונאוט” ייראו כמו תלבושת יום-יומית.",
    "והעובדה הכי מצחיקה: למרות כל זה—בשנה הבאה כולם חוזרים לראות שוב.",
    "המופע חייב להישאר קצר: שיר באירוויזיון מוגבל ל-3 דקות, כדי שאף בלדה לא תצליח להחזיק את אירופה כבת ערובה.",
    "על הבמה מותר עד 6 אנשים בלבד—גם אם השיר נשמע כאילו צריך מקהלה של 40.",
    "אסור להעלות בעלי חיים לבמה, כלומר אין סוסים, אין חתולים, ואין “רגע, זה זאב אמיתי?”.",
    "לאורך השנים הופיעו יותר עשן ופירוטכניקה מאשר בכמה מלחמות סרטים הוליוודיות.",
    "יש מדינות שמביאות “קונספט” ולא שיר—ואז כולם מתווכחים שבועיים מה בעצם ראו.",
    "האירוויזיון הוא כנראה המקום היחיד שבו כינור חשמלי ולבוש חללי נחשבים “בחירה שמרנית”.",
    "“דוּז פואַ” (12 נקודות) הפך לביטוי על-זמני שמסוגל לגרום לצעקה גם במשרד שקט.",
    "יש שירים שבהם הריקוד מפורסם יותר מהמנגינה—ולפעמים זה מרגיש ממש בכוונה.",
    "הרבה שירים נשמעים שמחים לגמרי, אבל מסתירים טקסט דרמטי של “נפרדנו אתמול ואני מת מבפנים”.",
    "יש קטע קבוע שבו המגישים מנסים להיות מצחיקים—והקהל בבית מתפלל שייגמר מהר.",
    "בקהל תמיד תימצא דגל ענק שלא ברור איך עבר אבטחה.",
    "מדי שנה יש לפחות הופעה אחת שבה מישהו מסתובב עם כנפיים/גלימה/שריון, כי למה לא.",
    "יש שנים שבהן חצי מהשירים מתחילים בלחישה אינטימית ואז מתפוצצים בפזמון כאילו מישהו לחץ “מצב טורבו”.",
    "לפעמים התחרות מרגישה כמו כנס של מעצבי תאורה עם הפסקות מוזיקה קצרות באמצע.",
    "אי אפשר לעלות עם מסר פוליטי ברור—מה שגורם לאנשים להיות יצירתיים מאוד עם “מטאפורות”.",
    "יש מדינות שמחליפות שפה לשיר כדי להיות מובנות יותר—ואז כולם מתגעגעים לרגעי “לא הבנתי מילה אבל זה היה מדהים”.",
    "כל שנה יש טרנד מוזיקלי חדש: שנה אחת EDM, שנה אחרת בלדות, ושנה אחרת… “שילוב של הכול יחד כי אירוויזיון”.",
    "מופע הביניים לפעמים כל כך מושקע שהוא גורם לשירי התחרות להיראות כמו חזרה גנרלית.",
    "יש הופעות שבהן נראה שהזמר/ת נלחם/ת עם הבמה (מדרגות, פלטפורמה, רוחות מלאכותיות) יותר מאשר עם התווים."
];

// ==========================================
// 2. SERVICES
// ==========================================

class NetworkService {
    static proxies = [
        (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, 
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
    ];

    static async delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    static async fetch(url, retries = 1) { 
        const shuffled = [...this.proxies].sort(() => 0.5 - Math.random());
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            for (const proxyGen of shuffled) {
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 6000);
                    const res = await fetch(proxyGen(url), { signal: controller.signal });
                    clearTimeout(id);
                    
                    if (res.ok) {
                        const data = await res.json(); 
                        if (data && data.contents) return data.contents; // allorigins
                        return JSON.stringify(data);
                    }
                } catch (e) { }
                await this.delay(200);
            }
            await this.delay(500); 
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
    
    static async enrich(url) { 
        return { image: null, summary: null, text: null }; 
    }
}

class TranslationService {
    static async translate(text, targetLang) {
        if (!text || text.length < 2) return { text: text || "", lang: "unknown" };
        if (targetLang === 'iw' && /[\u0590-\u05FF]/.test(text)) return { text: text, lang: 'he' };

        // 1. Gemini API
        if (API_KEY) {
            try {
                const prompt = `Translate to ${targetLang === 'en' ? 'English' : 'Hebrew'}: "${text}". Return JSON: {"translatedText": "...", "detectedLanguage": "..."}`;
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
                    return { text: json.translatedText, lang: json.detectedLanguage || 'detected' };
                }
            } catch(e) {}
        }
        
        // 2. Fallback: Google Translate via Proxy
        try {
             const tl = targetLang === 'he' ? 'iw' : targetLang;
             const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text.substring(0, 500))}`;
             const raw = await NetworkService.fetch(gtUrl);
             if (raw) {
                 let data;
                 try { data = JSON.parse(raw); } catch { data = raw; }
                 if (typeof data === 'string') data = JSON.parse(data);

                 if (data && data[0]) {
                     const translated = data[0].map(x => x[0]).join('');
                     return { text: translated, lang: 'detected' };
                 }
             }
        } catch(e) {}

        return { text: text, lang: 'error' }; 
    }
}

class ScraperEngine {
    static async getRSSFeed(source, hours = 72, limit = 0) {
        let feedUrl = source.url || "";
        
        if (feedUrl.includes('reddit.com') && !feedUrl.includes('.rss') && !feedUrl.includes('.xml')) {
             feedUrl = feedUrl.endsWith('/') ? `${feedUrl}.rss` : `${feedUrl}/.rss`;
        }

        if (source.type === 'search') {
            feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(source.query)}&hl=en-US&gl=US&ceid=US:en`;
        }

        if (!feedUrl) return [];

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hours);

        const processItems = (items) => {
            let processed = items.map((item) => {
                const snippet = (item.description || "").replace(/<[^>]*>?/gm, '').trim();
                const pubDateStr = item.pubDate || new Date().toISOString();
                const pubDate = new Date(pubDateStr);

                if (pubDate < cutoffDate) return null;

                let img = item.thumbnail || item.enclosure?.link || null;
                if (!img && item.description) {
                     const match = item.description.match(/src=["']([^"']+)["']/);
                     if (match) img = match[1];
                }
                if (!img && item['media:content']) {
                     img = item['media:content'].url;
                }

                return {
                    source: source.name,
                    title: item.title || "No Title",
                    link: item.link || "#",
                    originLang: ContentProcessor.detectLanguage(item.title),
                    pubDate: pubDate.toISOString(),
                    img: img || null, 
                    snippet: snippet || "",
                    type: source.type
                };
            }).filter(Boolean);
            
            if (limit > 0) processed = processed.slice(0, limit);
            return processed;
        };

        // Try rss2json first
        try {
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=100`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok' && data.items) {
                    return processItems(data.items);
                }
            }
        } catch(e) {}

        // Try raw fetch (proxies)
        try {
            const xmlStr = await NetworkService.fetch(feedUrl);
            if (!xmlStr) return null; 
            
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlStr, "text/xml");
            const items = Array.from(xml.querySelectorAll("item"));
            
            const rawItems = items.map(item => {
                 const media = item.getElementsByTagNameNS("*", "content");
                 let thumb = item.getElementsByTagNameNS("*", "thumbnail")[0]?.getAttribute("url");
                 if(!thumb && media.length > 0) thumb = media[0].getAttribute("url");
                 
                 return {
                    title: item.querySelector("title")?.textContent,
                    link: item.querySelector("link")?.textContent,
                    pubDate: item.querySelector("pubDate")?.textContent,
                    description: item.querySelector("description")?.textContent,
                    enclosure: { link: item.querySelector("enclosure")?.getAttribute("url") },
                    thumbnail: thumb,
                    'media:content': { url: thumb }
                };
            });

            return processItems(rawItems);
        } catch(e) { return null; } 
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

const isLast24Hours = (dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      return (now.getTime() - d.getTime()) < 24 * 60 * 60 * 1000; 
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

// ... LoadingScreen, TeamModal, SourcesModal, StatsModal, EditProfileModal ...
const LoadingScreen = ({ status, progress, total, onStop, sourceStatuses }) => {
    const [fact, setFact] = useState(FUN_FACTS[0]);
    const [showLog, setShowLog] = useState(false);
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
                                <span className={`truncate ${s.status === 'success' ? 'text-slate-300' : s.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>
                                    {s.name} {s.count > 0 && `(${s.count})`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 justify-center">
                    <button onClick={() => setShowLog(!showLog)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mb-2">
                        <Terminal size={12}/> {showLog ? 'הסתר לוג' : 'הצג לוג מפורט'}
                    </button>
                </div>
                {showLog && (
                    <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-green-400 h-24 overflow-y-auto mb-4 text-left" dir="ltr">
                        {sourceStatuses.map((s, i) => (
                            <div key={i}>{`[${s.status.toUpperCase()}] ${s.name}: ${s.count} items`}</div>
                        ))}
                    </div>
                )}
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

const SourcesModal = ({ onClose, sources, counts, excluded, onToggle, onAdd, onRemove, onRefreshSource, scanWindow, onUpdateScanWindow, articleLimit, onUpdateArticleLimit }) => {
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const allSourcesList = sources || [];

    // SEEDING FUNCTION
    const handleSeedSources = async () => {
        if (!confirm("פעולה זו תעלה כ-80 מקורות למסד הנתונים. האם להמשיך?")) return;
        
        try {
            const batch = writeBatch(db);
            const sourcesRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config');
            
            // אנחנו שומרים את זה תחת config -> customSources כרגע כדי לא לשבור את הלוגיקה הקיימת בקוד
            // אבל מכניסים את כל הרשימה הגדולה
            await setDoc(sourcesRef, { customSources: SEED_SOURCES_LIST }, { merge: true });
            
            alert("המקורות עלו בהצלחה! הרשימה תתעדכן מיד.");
            onClose(); // סגור את המודל לרענון
        } catch (e) {
            console.error(e);
            alert("שגיאה בהעלאת מקורות: " + e.message);
        }
    };

    const handleMagicAdd = () => {
         if (!newUrl || !newName) return;
         let urlToAdd = newUrl;
         if (urlToAdd.includes('reddit.com') && !urlToAdd.includes('.rss') && !urlToAdd.includes('.xml')) {
             urlToAdd = urlToAdd.endsWith('/') ? `${urlToAdd}.rss` : `${urlToAdd}/.rss`;
         } else if (!urlToAdd.includes('/feed') && !urlToAdd.includes('.xml') && !urlToAdd.includes('rss')) {
             urlToAdd = urlToAdd.endsWith('/') ? `${urlToAdd}feed` : `${urlToAdd}/feed`;
         }
         onAdd({name: newName, url: urlToAdd, type: 'website'});
         setNewName(''); setNewUrl('');
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex gap-2 items-center"><Layers/> ניהול מקורות</h2>
                    <button onClick={handleSeedSources} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center gap-1">
                        <UploadCloud size={12}/> אתחול מקורות ראשוני
                    </button>
                </div>
                
                {/* SETTINGS AREA */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-600 mb-6 flex flex-col gap-3">
                    <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-2"><Settings size={14}/> הגדרות סריקה</h3>
                    <div className="flex items-center gap-4">
                        <label className="text-slate-400 text-xs">חלון זמן לסריקה (שעות):</label>
                        <input 
                            type="number" 
                            value={scanWindow} 
                            onChange={(e) => onUpdateScanWindow(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-600 rounded p-1 text-white w-20 text-center text-sm"
                            min="1"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-slate-400 text-xs">הגבלת כמות כתבות (לכל מקור):</label>
                        <input 
                            type="number" 
                            value={articleLimit} 
                            onChange={(e) => onUpdateArticleLimit(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-600 rounded p-1 text-white w-20 text-center text-sm"
                            min="0"
                            placeholder="0 = ללא"
                        />
                        <span className="text-[10px] text-slate-500">(0 = ללא הגבלה)</span>
                    </div>
                </div>

                <div className="flex gap-2 mb-4 bg-slate-900 p-3 rounded-lg" dir="rtl">
                    <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="שם המקור" className="flex-1 p-2 rounded bg-slate-800 border border-slate-600 text-white text-sm"/>
                    <div className="flex-[2] flex relative">
                        <input value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="כתובת האתר / RSS" className="w-full p-2 rounded-r bg-slate-800 border border-slate-600 text-white text-sm" dir="ltr"/>
                        <button onClick={handleMagicAdd} className="bg-blue-600 text-white px-4 rounded-l font-bold text-sm flex items-center gap-1"><Wand2 size={14}/> הוסף</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 pr-2" dir="rtl">
                    {allSourcesList.map((s, i) => {
                        const isExcluded = excluded.has(s.name);
                        const count = counts[s.name] || 0; 
                        const isCustom = !INITIAL_SOURCES.find(is => is.name === s.name);
                        
                        return (
                            <div key={i} className={`flex justify-between items-center p-3 rounded border ${isExcluded ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-700 border-slate-600 text-white'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <input 
                                        type="checkbox" 
                                        checked={!isExcluded} 
                                        onChange={() => onToggle(s.name)}
                                        className="w-4 h-4 accent-green-500 cursor-pointer rounded"
                                    />
                                    <span className="truncate text-sm font-bold">{s.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="text-xs text-slate-400 font-mono">{count}</span>
                                     <button onClick={() => onRefreshSource(s)} className="p-1 hover:text-green-400 text-slate-500"><RefreshCw size={12}/></button>
                                     <button onClick={() => onRemove(s)} className="p-1 hover:text-red-500 text-slate-500"><Trash2 size={12}/></button>
                                     <span className="text-[10px] uppercase bg-slate-900 px-1.5 rounded opacity-70">{s.type}</span>
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

    // SNIPPET DISPLAY LOGIC
    const rawSnippet = article.snippetHe || article.snippetEn || article.snippet || '';
    const shouldTruncate = rawSnippet.length > 250;
    const displayedSnippet = isExpanded ? rawSnippet : (shouldTruncate ? rawSnippet.substring(0, 250) + "..." : rawSnippet);

    useEffect(() => { if (article.img) setLocalImg(article.img); }, [article.img]);

    let displayTitle = article.title;
    
    if (globalLang === 'he') {
        if (article.titleHe) displayTitle = article.titleHe;
    } else if (globalLang === 'en') {
        if (article.titleEn) displayTitle = article.titleEn;
    } else { displayTitle = article.originalTitle || article.title; }

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
             flagged: true, 
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

             if (statField) {
                 updateUserStats(user.displayName, statField, newVal ? 1 : -1);
             }
        }

        const isAllDone = (
            (field === 'publishedSite' ? newVal : article.publishedSite) &&
            (field === 'publishedSocialHe' ? newVal : article.publishedSocialHe) &&
            (field === 'publishedSocialEn' ? newVal : article.publishedSocialEn) &&
            (field === 'translationComplete' ? newVal : article.translationComplete)
        );

        if (isAllDone) {
            updates.status = 'published';
            updates.flagged = false;
        } else if (article.status === 'published' && !newVal) {
            updates.status = 'review';
        }

        if(user?.displayName && newVal) updateUserStats(user.displayName, field, 1);
        onUpdate(article.id, updates);
    };
    
    const handleArchive = () => {
        onUpdate(article.id, { status: 'archived', flagged: false });
    };

    const toggleFlag = () => {
        const newVal = !article.flagged;
        onUpdate(article.id, { flagged: newVal, status: newVal ? 'waiting_writing' : 'new', flaggedAt: newVal ? serverTimestamp() : null });
    };
    
    const handleLinkClick = () => {
        incrementArticleView(article.id);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        onUpdate(article.id, { processing: true });
        try {
            const updates = {};
             if (!article.titleHe) {
                 const t = await TranslationService.translate(article.title, 'iw');
                 if (t.text) updates.titleHe = t.text;
                 const te = await TranslationService.translate(article.title, 'en');
                 if (te.text) updates.titleEn = te.text;
             }
             if (!article.snippet || (!article.img)) {
                 const meta = await ContentProcessor.enrich(article.link);
                 if (meta.summary && !article.snippet) updates.snippet = meta.summary;
                 if (meta.image && !article.img) {
                     updates.img = meta.image;
                     setLocalImg(meta.image);
                 }
             }
             const txt = updates.snippet || article.snippet;
             if (txt) {
                  const st = await TranslationService.translate(txt, 'iw');
                  if (st.text) updates.snippetHe = st.text;
                  const ste = await TranslationService.translate(txt, 'en');
                  if (ste.text) updates.snippetEn = ste.text;
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
        setWaLoading(true);
        let titleToShare = article.titleHe || article.title;
        let snippetToShare = article.snippetHe || article.snippet;

        if (!article.titleHe || !article.snippetHe) {
            try {
                if(!article.titleHe) {
                    const t = await TranslationService.translate(article.title, 'iw');
                    if (t.text) { titleToShare = t.text; onUpdate(article.id, {titleHe: t.text}); }
                }
                if(!article.snippetHe && article.snippet) {
                    const s = await TranslationService.translate(article.snippet, 'iw');
                    if (s.text) { snippetToShare = s.text; onUpdate(article.id, {snippetHe: s.text}); }
                }
            } catch(e) {}
        }
        
        const text = `*${titleToShare}*\n\n${snippetToShare || ''}\n\n${article.link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setWaLoading(false);
    };

    const saveDocLink = () => { onUpdate(article.id, { docLink: docLinkInput }); setDocLinkMode(false); };
    
    const isAssignedToMe = user && article.assignedTo === user.displayName;

    const StatusButtons = () => (
        <div className="flex gap-1 justify-end items-center">
             <button onClick={() => toggleField('translationComplete')} title="תורגם ע״י הכתב" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.translationComplete ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Languages size={14}/></button>
             <button onClick={() => toggleField('publishedSite')} title="כתבה פורסמה" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.publishedSite ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Globe size={14}/></button>
             <button onClick={() => toggleField('publishedSocialHe')} title="סושיאל עברית" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.publishedSocialHe ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><Share2 size={14}/></button>
             <button onClick={() => toggleField('publishedSocialEn')} title="סושיאל אנגלית" className={`p-1.5 rounded transition-all w-7 h-7 flex items-center justify-center ${article.publishedSocialEn ? 'bg-pink-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}><span className="text-[10px] font-bold">EN</span></button>
             
             <button onClick={handleArchive} title="ארכב (סיים)" className="p-1.5 rounded bg-slate-800 text-slate-500 hover:text-white ml-1 w-7 h-7 flex items-center justify-center border border-slate-600">
                 <Archive size={12}/>
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
                                 {waLoading ? <Loader2 size={10} className="animate-spin"/> : <MessageCircle size={10}/>}
                             </button>
                             <button onClick={handleRefresh} title="רענן נתונים" className="p-1 rounded bg-slate-700 text-slate-400 hover:text-white">
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
                         {waLoading ? <Loader2 size={12} className="animate-spin"/> : <MessageCircle size={12}/>}
                    </button>
                    <button onClick={handleRefresh} title="רענן נתונים" className="p-1 rounded bg-slate-700 text-slate-400 hover:text-white">
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
                
                {rawSnippet && !isMobile && (
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
  const [scanWindow, setScanWindow] = useState(72); 
  const [articleLimit, setArticleLimit] = useState(0); 
  
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
  const [showUserModal, setShowUserModal] = useState(false); 
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false); 
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [userProfileInput, setUserProfileInput] = useState({ name: '', role: 'כתב' });

  const [sourcesList, setSourcesList] = useState(INITIAL_SOURCES);
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

  const handleAddSource = (newSrc) => {
      setSourcesList(prev => [...prev, newSrc]);
  };
  
  const handleUpdateScanWindow = (hours) => {
      setScanWindow(hours);
  };

  const handleUpdateArticleLimit = (limit) => {
      setArticleLimit(limit);
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

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
      if(!user || !db) return;
      const unsubArticles = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'articles'), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const now = new Date();
          const filteredList = list.filter(a => (now - new Date(a.pubDate)) < scanWindow * 60 * 60 * 1000);
          
          filteredList.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          setArticles(filteredList);
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

  const handleGoogleLogin = async () => {
      if(!auth) {
          alert("שגיאה: מערכת האימות לא אתחלה כראוי (חסר Firebase Config?)");
          return;
      }
      try { 
        await signInWithPopup(auth, new GoogleAuthProvider()); 
      } catch(e) {
         console.error("Google Login Error:", e);
         alert(`שגיאת התחברות: ${e.message}`);
      }
  };

  const handleUpdateTeam = async (newTeam) => {
      setTeam(newTeam);
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { team: newTeam }, { merge: true });
  };

  const handleAddCustomSource = async (newSrc) => {
      if (sourcesList.find(s => s.name === newSrc.name)) {
          alert('מקור עם שם זה כבר קיים');
          return;
      }
      const currentCustom = sourcesList.filter(s => !INITIAL_SOURCES.find(i => i.name === s.name));
      const updatedCustom = [...currentCustom, newSrc];
      setSourcesList(prev => [...prev, newSrc]);
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { customSources: updatedCustom }, { merge: true });
  };

  const handleRemoveSource = async (sourceToRemove) => {
      const currentCustom = sourcesList.filter(s => !INITIAL_SOURCES.find(i => i.name === s.name));
      const updatedCustom = currentCustom.filter(s => s.name !== sourceToRemove.name);
      setSourcesList(prev => prev.filter(s => s.name !== sourceToRemove.name));
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'config'), { customSources: updatedCustom }, { merge: true });
  };
  
  const handleRefreshSource = async (source) => {
      setScanning(true);
      setScanStatus(`מרענן את ${source.name}...`);
      const items = await ScraperEngine.getRSSFeed(source, scanWindow, articleLimit);
      
      setSourceStatuses(prev => {
          const exists = prev.find(s => s.name === source.name);
          if (exists) {
              return prev.map(s => s.name === source.name ? { ...s, status: 'success', count: items ? items.length : 0 } : s);
          }
          return [...prev, { name: source.name, status: 'success', count: items ? items.length : 0 }];
      });
      
      if (items && items.length > 0) {
          const existingLinks = new Set(articles.map(a => a.link));
          const newItems = items.filter(item => !existingLinks.has(item.link));
          
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

  const runScan = async () => {
    if(scanning || !db) return;
    setScanning(true);
    setScanStatus("מתחיל סריקה...");
    setScanProgress(0);
    
    const activeSources = sourcesList.filter(s => !excludedSources.has(s.name));
    
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
    
    const batchSize = 2; 
    let allResults = [];
    let completed = 0;

    for(let i = 0; i < interleaved.length; i += batchSize) {
        const batch = interleaved.slice(i, i + batchSize);
        
        setSourceStatuses(prev => prev.map(s => batch.some(b => b.name === s.name) ? { ...s, status: 'loading' } : s));

        const batchPromises = batch.map(async (src, idx) => {
            const items = await ScraperEngine.getRSSFeed(src, scanWindow, articleLimit);
            setSourceStatuses(prev => prev.map(s => 
                s.name === src.name ? { ...s, status: items ? 'success' : 'error', count: items ? items.length : 0 } : s
            ));
            return items || [];
        });

        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((res) => {
            if(res.status === 'fulfilled') allResults.push(...res.value);
        });
        
        completed += batch.length;
        setScanProgress(Math.min(completed, interleaved.length));
        await new Promise(r => setTimeout(r, 2000)); 
    }

    setScanStatus(`נמצאו ${allResults.length} כתבות... מסנכרן...`);
    
    if (allResults.length > 0) {
        const existingLinks = new Set(articles.map(a => a.link));
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
  
  const sourcesStats = useMemo(() => {
      const stats = {};
      sourcesList.forEach(s => stats[s.name] = 0);
      articles.forEach(a => { if(a.source) stats[a.source] = (stats[a.source] || 0) + 1; });
      return stats;
  }, [articles, sourcesList]);

  useEffect(() => {
      if (articles.length === 0) {
          setIsProcessingBackground(false);
          return;
      }
      const timer = setInterval(async () => {
          const item = articles.find(a => !a.isCustom && (!a.translationComplete || (!a.snippetHe && a.snippet)) && !a.processing && a.status !== 'archived');
          
          if (item) {
              setIsProcessingBackground(true);
              
              let updates = {};
              if (!item.titleHe) {
                  const t = await TranslationService.translate(item.title, 'iw');
                  if (t.text && t.text !== item.title) updates.titleHe = t.text;
                  const te = await TranslationService.translate(item.title, 'en');
                  if (te.text && te.text !== item.title) updates.titleEn = te.text;
              }
              if (!item.snippet || (!item.img)) {
                  const meta = await ContentProcessor.enrich(item.link);
                  if (meta.summary && !item.snippet) updates.snippet = meta.summary;
                  if (meta.image && !item.img) updates.img = meta.image;
              }
              
              if ((updates.snippet || item.snippet) && !item.snippetHe) {
                  const txt = updates.snippet || item.snippet;
                  if (txt && txt.length > 5) {
                      const st = await TranslationService.translate(txt, 'iw');
                      if (st.text) updates.snippetHe = st.text;
                      const ste = await TranslationService.translate(txt, 'en');
                      if (ste.text) updates.snippetEn = ste.text;
                  }
              }

              if (Object.keys(updates).length > 0) {
                  await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'articles', item.id), updates);
              }
          } else {
              setIsProcessingBackground(false);
          }
      }, 4000);
      return () => clearInterval(timer);
  }, [articles]);

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
        {enhanceTotal > 0 && enhanceProgress < enhanceTotal && (
             <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-[300]">
                 <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{width: `${(enhanceProgress/enhanceTotal)*100}%`}}></div>
                 <div className="absolute top-1 left-2">
                     <Activity size={12} className="text-green-400 animate-pulse"/>
                 </div>
             </div>
        )}
        
        {showTeamModal && <TeamModal onClose={()=>setShowTeamModal(false)} team={team} onUpdateTeam={handleUpdateTeam} />}
        {showEditProfile && user && <EditProfileModal onClose={() => setShowEditProfile(false)} user={user} onSave={handleUpdateProfile} />}
        {showSourcesModal && <SourcesModal onClose={() => setShowSourcesModal(false)} sources={sourcesList} counts={sourcesStats} excluded={excludedSources} onToggle={handleToggleSource} onAdd={handleAddCustomSource} onRemove={handleRemoveSource} onRefreshSource={handleRefreshSource} scanWindow={scanWindow} onUpdateScanWindow={handleUpdateScanWindow} articleLimit={articleLimit} onUpdateArticleLimit={handleUpdateArticleLimit} />}
        {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} team={team} user={user} />}
        {showTaskModal && <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"><div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6"><h3 className="text-white font-bold mb-4">הוסף משימה ידנית</h3><input value={manualTitle} onChange={e=>setManualTitle(e.target.value)} placeholder="כותרת" className="w-full mb-4 p-2 bg-slate-900 text-white rounded border border-slate-600"/><div className="flex items-center gap-2 mb-4 bg-slate-900 rounded border border-slate-600 p-1"><LinkIcon size={16} className="text-slate-500 ml-2"/><input value={manualLink} onChange={e=>setManualLink(e.target.value)} placeholder="קישור למקור (אופציונלי)" className="flex-1 bg-transparent text-white outline-none text-sm" dir="ltr"/></div><button onClick={addManualTask} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">הוסף</button><button onClick={()=>setShowTaskModal(false)} className="w-full mt-2 text-slate-400 hover:text-white">ביטול</button></div></div>}
        {scanning && <LoadingScreen status={scanStatus} progress={scanProgress} total={scanTotal} onStop={() => setScanning(false)} sourceStatuses={sourceStatuses} />}

        <div className="flex h-screen overflow-hidden">
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
                    <div className="text-2xl font-black text-white relative">
                        מרכז <span className="text-red-500">המקורות</span>
                        {isProcessingBackground && <span className="absolute -top-1 -right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                    </div>
                    
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
                         <button id="scan-btn" onClick={runScan} disabled={scanning} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white text-xs shadow-lg transition-all ${scanning ? 'bg-slate-600' : 'bg-[#E3000F] hover:bg-red-600'}`}><RefreshCw size={14} className={scanning ? 'animate-spin' : ''}/> {scanning ? 'סורק...' : 'סנכרון'}</button>
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