const axios = require("axios");
const cheerio = require("cheerio");

const TARGET_URL = "https://www.euromix.co.il/a123/";

async function debug() {
  console.log("🕵️‍♂️ מתחיל חקירה של הדף...");

  try {
    const response = await axios.get(TARGET_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);

    console.log(`📄 גודל הדף שירד: ${html.length} תווים`);

    // בדיקה 1: האם יש בכלל קישורים חיצוניים?
    const allLinks = $('a');
    console.log(`🔗 סה"כ נמצאו ${allLinks.length} קישורים בדף.`);

    console.log("--- דוגמה ל-10 הקישורים הראשונים שנמצאו ---");
    allLinks.slice(0, 10).each((i, el) => {
        console.log(`[${i}] Text: ${$(el).text().trim().substring(0, 30)}... | Href: ${$(el).attr('href')}`);
    });

    // בדיקה 2: חיפוש ספציפי של אלמנטים חשודים
    const wprss = $('.wprss-feed-item').length;
    const elementor = $('.elementor-post').length;
    const rssAgg = $('.rss-aggregator-item').length;
    
    console.log("\n--- תוצאות חיפוש תבניות ---");
    console.log(`wprss-feed-item: ${wprss}`);
    console.log(`elementor-post: ${elementor}`);
    console.log(`rss-aggregator-item: ${rssAgg}`);

  } catch (e) {
    console.error("❌ שגיאה:", e.message);
  }
}

debug();