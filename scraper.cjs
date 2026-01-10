const admin = require("firebase-admin");
const puppeteer = require("puppeteer");

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
    console.log("🚀 מפעיל דפדפן רובוטי...");
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1366, height: 768 });
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 90000 });
        
        await autoScroll(page);

        const articles = await page.evaluate(() => {
            const results = [];
            const allLinks = document.querySelectorAll('a');

            // פונקציית עזר לחישוב זמן יחסי (למשל: "לפני 3 שעות")
            const parseRelativeTime = (text) => {
                if (!text) return new Date().toISOString();
                
                const now = new Date();
                const cleanText = text.toLowerCase();
                
                // חילוץ מספרים
                const match = cleanText.match(/(\d+)/);
                if (!match) return now.toISOString();
                const num = parseInt(match[0]);

                if (cleanText.includes('דק') || cleanText.includes('min')) {
                    now.setMinutes(now.getMinutes() - num);
                } else if (cleanText.includes('שע') || cleanText.includes('hour')) {
                    now.setHours(now.getHours() - num);
                } else if (cleanText.includes('יום') || cleanText.includes('ימים') || cleanText.includes('day')) {
                    now.setDate(now.getDate() - num);
                }
                
                return now.toISOString();
            };

            allLinks.forEach(link => {
                const href = link.href;
                const title = link.innerText.trim();
                
                if (!href || href.length < 10) return;
                if (href.includes('euromix.co.il')) return;
                if (href.includes('facebook.com') || href.includes('twitter.com') || href.includes('whatsapp.com') || href.includes('instagram.com') || href.includes('google.com')) return;
                if (title.length < 15) return;

                // חיפוש אלמנט תאריך בקרבת הקישור
                let dateStr = null;
                let container = link.parentElement;
                let depth = 0;
                
                // מחפש למעלה ולמטה טקסט שמרמז על זמן
                while (container && !dateStr && depth < 3) {
                    // נסה למצוא טקסט שמכיל "לפני" או "ago" בתוך הקונטיינר
                    const timeElement = Array.from(container.querySelectorAll('*')).find(el => 
                        el.innerText.includes('לפני') || el.innerText.includes('ago')
                    );
                    
                    if (timeElement) {
                        dateStr = timeElement.innerText;
                    } else if (container.innerText.includes('לפני') || container.innerText.includes('ago')) {
                        // לפעמים הטקסט נמצא ישירות בקונטיינר
                        dateStr = container.innerText;
                    }
                    
                    container = container.parentElement;
                    depth++;
                }

                // חילוץ תמונה
                let img = null;
                container = link.parentElement;
                depth = 0;
                while (container && !img && depth < 3) {
                    const foundImg = container.querySelector('img');
                    if (foundImg) {
                        img = foundImg.src || foundImg.getAttribute('data-src');
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
                    pubDate: parseRelativeTime(dateStr), // שימוש בפונקציית הזמן החדשה
                    snippet: title
                });
            });

            return results;
        });

        console.log(`✅ נמצאו ${articles.length} כתבות.`);

        // סינון כפילויות
        const uniqueArticles = Array.from(new Map(articles.map(item => [item.link, item])).values());

        const batch = db.batch();
        let count = 0;
        let savedCount = 0;

        for (const article of uniqueArticles) {
            // בדיקה אם הכתבה כבר קיימת כדי לא לדרוס אותה (וכך לאבד את הסטטוס שלה)
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
                flagged: false,
                publishedSite: false,
                publishedSocialHe: false,
                publishedSocialEn: false,
                translationComplete: false,
                assignedTo: null,
                isCustom: false,
                hasCountedWriting: false
            });
            
            savedCount++;
            count++;
            
            if (count >= 400) {
                await batch.commit();
                count = 0;
            }
        }

        if (count > 0) await batch.commit();
        console.log(`🎉 נשמרו ${savedCount} כתבות חדשות.`);

        // === עדכון זמן הריצה האחרון ===
        // שים לב: אנחנו משתמשים ב-Date עכשיווי של השרת כדי למנוע בעיות אזורי זמן
        await db.collection('artifacts').doc(APP_ID)
            .collection('public').doc('data').collection('settings').doc('status')
            .set({ lastScrape: admin.firestore.Timestamp.now() }, { merge: true });
            
        console.log("⏰ זמן סריקה עודכן.");

    } catch (e) {
        console.error("❌ שגיאה:", e);
    } finally {
        await browser.close();
    }
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

run();