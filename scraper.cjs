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
        await page.setViewport({ width: 1280, height: 800 });

        console.log("globe טוען את העמוד...");
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        
        console.log("⏳ ממתין שהתוכן ייטען...");
        await new Promise(r => setTimeout(r, 5000)); 

        const articles = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.anwp-pg-post-teaser, article, .wprss-feed-item');

            items.forEach(item => {
                const linkEl = item.querySelector('a');
                if (!linkEl) return;

                const title = linkEl.innerText.trim();
                const link = linkEl.href;
                let img = null;
                const imgEl = item.querySelector('img');
                if (imgEl) img = imgEl.src || imgEl.getAttribute('data-src');

                let source = "EuroMix";
                try {
                    const urlObj = new URL(link);
                    source = urlObj.hostname.replace('www.', '');
                } catch (e) {}

                let dateStr = new Date().toISOString();
                
                if (title.length > 2 && !link.includes('euromix.co.il')) {
                    results.push({
                        title,
                        link,
                        source,
                        pubDate: dateStr,
                        img: img,
                        snippet: title
                    });
                }
            });

            return results;
        });

        console.log(`✅ הרובוט מצא ${articles.length} כתבות.`);

        // --- התיקון הקריטי כאן ---
        let batch = db.batch(); // יצירת Batch ראשוני
        let count = 0;
        let savedCount = 0;

        for (const article of articles) {
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
            
            // אם הגענו ל-400, שומרים ומתחילים חדש
            if (count >= 400) {
                await batch.commit();
                console.log("📦 נגלה של 400 נשמרה...");
                batch = db.batch(); // <--- השורה שהייתה חסרה!
                count = 0;
            }
        }

        if (count > 0) await batch.commit();
        console.log(`🎉 סך הכל נשמרו ${savedCount} כתבות חדשות!`);

    } catch (e) {
        console.error("❌ שגיאה:", e);
    } finally {
        await browser.close();
    }
}

run();