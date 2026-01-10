const admin = require("firebase-admin");
const puppeteer = require("puppeteer");

// וודא שקובץ המפתחות נמצא באותה תיקייה
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const APP_ID = 'euromix-pro-v3'; 
const TARGET_URL = "https://www.euromix.co.il/a123/";

async function run() {
    console.log("🚀 מתחיל ריצה...");
    
    // הגדרת דפדפן עם מקסימום ביצועים
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // מונע קריסות זיכרון
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ] 
    });
    
    const page = await browser.newPage();

    // נרשום זמן עדכון כבר בהתחלה כדי לתת חיווי שהתהליך רץ
    await updateStatusTime();

    try {
        // הגדרת מסך גדול כדי לטעון יותר פריטים בבת אחת
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log("globe: טוען את העמוד...");
        // זמן טעינה ארוך יותר (3 דקות) למקרה שהאינטרנט איטי
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 180000 });
        
        console.log("⬇️ מתחיל גלילה עמוקה...");
        await aggressiveAutoScroll(page);
        console.log("✅ גלילה הסתיימה.");

        const articles = await page.evaluate(() => {
            const results = [];
            const allLinks = document.querySelectorAll('a');

            // פונקציית עזר לחישוב זמן יחסי
            const parseRelativeTime = (text) => {
                if (!text) return new Date().toISOString();
                const now = new Date();
                const cleanText = text.toLowerCase();
                const match = cleanText.match(/(\d+)/);
                if (!match) return now.toISOString();
                const num = parseInt(match[0]);

                if (cleanText.includes('דק') || cleanText.includes('min')) now.setMinutes(now.getMinutes() - num);
                else if (cleanText.includes('שע') || cleanText.includes('hour')) now.setHours(now.getHours() - num);
                else if (cleanText.includes('יום') || cleanText.includes('ימים') || cleanText.includes('day')) now.setDate(now.getDate() - num);
                
                return now.toISOString();
            };

            allLinks.forEach(link => {
                const href = link.href;
                let title = link.innerText.trim();
                
                if (!href || href.length < 10) return;
                // סינונים
                if (href.includes('euromix.co.il')) return;
                if (href.includes('facebook.com') || href.includes('twitter.com') || href.includes('whatsapp.com')) return;
                if (title.length < 10) return; // כותרת קצרה מידי היא כנראה זבל

                // ניסיון לחילוץ תאריך
                let dateStr = null;
                let container = link.parentElement;
                let depth = 0;
                while (container && !dateStr && depth < 3) {
                    // מחפש טקסט שמכיל מספר ואת המילים "לפני" או "ago"
                    if ((container.innerText.includes('לפני') || container.innerText.includes('ago')) && /\d/.test(container.innerText)) {
                         // מנקה את הטקסט כדי למצוא רק את שורת הזמן
                         const lines = container.innerText.split('\n');
                         const timeLine = lines.find(l => (l.includes('לפני') || l.includes('ago')) && /\d/.test(l));
                         if (timeLine) dateStr = timeLine;
                    }
                    container = container.parentElement;
                    depth++;
                }

                // ניסיון לחילוץ תמונה
                let img = null;
                container = link.parentElement;
                depth = 0;
                while (container && !img && depth < 4) {
                    const foundImg = container.querySelector('img');
                    if (foundImg) {
                        img = foundImg.src || foundImg.getAttribute('data-src');
                        // סינון אייקונים קטנים
                        if (img && (img.includes('icon') || img.includes('logo'))) img = null;
                    }
                    container = container.parentElement;
                    depth++;
                }

                let source = "Unknown";
                try {
                    const urlObj = new URL(href);
                    source = urlObj.hostname.replace('www.', '');
                } catch (e) {}

                results.push({
                    title: title,
                    link: href,
                    source: source,
                    img: img,
                    pubDate: parseRelativeTime(dateStr),
                    snippet: title
                });
            });

            return results;
        });

        console.log(`🔍 נמצאו ${articles.length} קישורים (כולל כפילויות).`);

        // הסרת כפילויות לפי לינק
        const uniqueArticles = Array.from(new Map(articles.map(item => [item.link, item])).values());
        console.log(`✨ ${uniqueArticles.length} כתבות ייחודיות לטיפול.`);

        const batch = db.batch();
        let operationCount = 0;
        let savedCount = 0;

        for (const article of uniqueArticles) {
            // בדיקה האם הכתבה קיימת כבר - כדי לא לדרוס סטטוסים
            const exists = await db.collection('artifacts').doc(APP_ID)
                .collection('public').doc('data').collection('articles')
                .where('link', '==', article.link).limit(1).get();

            if (!exists.empty) continue;

            const docRef = db.collection('artifacts').doc(APP_ID)
                .collection('public').doc('data').collection('articles').doc();

            batch.set(docRef, {
                ...article,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'new',
                flagged: false, // מסומן כברירת מחדל כדי שיראו את זה
                publishedSite: false,
                publishedSocialHe: false,
                publishedSocialEn: false,
                translationComplete: false,
                assignedTo: null,
                isCustom: false,
                hasCountedWriting: false
            });
            
            savedCount++;
            operationCount++;
            
            // Firebase Batch Limit is 500
            if (operationCount >= 450) {
                await batch.commit();
                operationCount = 0;
                // עדכון זמן שוב תוך כדי ריצה
                await updateStatusTime();
            }
        }

        if (operationCount > 0) await batch.commit();
        console.log(`🎉 סך הכל נשמרו: ${savedCount} כתבות חדשות.`);

        // עדכון זמן סופי
        await updateStatusTime();

    } catch (e) {
        console.error("❌ שגיאה קריטית בסריקה:", e);
    } finally {
        await browser.close();
        process.exit(0); // מסיים את התהליך בהצלחה
    }
}

// פונקציית גלילה אגרסיבית שלא מוותרת
async function aggressiveAutoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            let noChangeCount = 0; // כמה פעמים ניסינו לגלול ולא קרה כלום

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // אם הגענו לתחתית
                if (totalHeight >= scrollHeight - window.innerHeight) {
                    noChangeCount++;
                    // נחכה 20 איטרציות (כ-2 שניות) לראות אם משהו נטען
                    // אם אחרי 2 שניות הגובה לא השתנה - כנראה שסיימנו
                    if (noChangeCount > 40) { 
                        clearInterval(timer);
                        resolve();
                    }
                } else {
                    // אם הצלחנו לגלול עוד והגובה גדל - נאפס את המונה
                    noChangeCount = 0;
                }
            }, 50); // גלילה מהירה כל 50 מילישניות
        });
    });
}

async function updateStatusTime() {
    try {
        await db.collection('artifacts').doc(APP_ID)
            .collection('public').doc('data').collection('settings').doc('status')
            .set({ lastScrape: admin.firestore.Timestamp.now() }, { merge: true });
    } catch(e) {
        console.error("Error updating status time:", e);
    }
}

run();