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
        
        // גלילה כדי לטעון תמונות
        await autoScroll(page);

        const articles = await page.evaluate(() => {
            const results = [];
            const allLinks = document.querySelectorAll('a');

            allLinks.forEach(link => {
                const href = link.href;
                const title = link.innerText.trim();
                
                if (!href || href.length < 10) return;
                if (href.includes('euromix.co.il')) return;
                if (href.includes('facebook.com') || href.includes('twitter.com') || href.includes('whatsapp.com') || href.includes('instagram.com') || href.includes('google.com')) return;
                if (title.length < 15) return;

                // חילוץ תמונה משופר
                let img = null;
                let parent = link.parentElement;
                let depth = 0;
                while (parent && !img && depth < 3) { // מחפש 3 רמות למעלה
                    const foundImg = parent.querySelector('img');
                    if (foundImg) {
                        img = foundImg.src || foundImg.getAttribute('data-src');
                    }
                    parent = parent.parentElement;
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
                    pubDate: new Date().toISOString(),
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
        await db.collection('artifacts').doc(APP_ID)
            .collection('public').doc('data').collection('settings').doc('status')
            .set({ lastScrape: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            
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