import { NetworkService } from './NetworkService';

export class ContentProcessor {
    static detectLanguage(text) {
        if (!text) return null;
        const lower = text.toLowerCase();
        if (/[\u0590-\u05FF]/.test(text)) return 'Hebrew';
        if (/[\u0400-\u04FF]/.test(text)) return 'Cyrillic';
        if (/[\u0370-\u03FF]/.test(text)) return 'Greek';
        if (/\b(the|and|is|to|of)\b/.test(lower)) return 'English';
        if (/\b(le|la|les|et|est|pour)\b/.test(lower)) return 'French';
        if (/\b(el|la|los|y|en|por)\b/.test(lower)) return 'Spanish';
        if (/\b(der|die|das|und)\b/.test(lower)) return 'German';
        return null;
    }

    static async enrich(url) {
        try {
            const html = await NetworkService.fetch(url);
            if (!html) return { image: null, summary: null };

            const doc = new DOMParser().parseFromString(html, "text/html");
            let image = null;
            let description = null;

            // 1. JSON-LD (הכי אמין)
            const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
            for (let script of scripts) {
                try {
                    const json = JSON.parse(script.textContent);
                    const possibleImg = json.image?.url || json.image || 
                                      (Array.isArray(json.image) ? json.image[0] : null) ||
                                      json['@graph']?.find(g => g.image)?.image?.url;
                    
                    if (possibleImg && typeof possibleImg === 'string') {
                        image = possibleImg;
                        break;
                    }
                } catch (e) {}
            }

            // 2. Meta Tags (Open Graph / Twitter)
            if (!image) {
                image = doc.querySelector('meta[property="og:image"]')?.content ||
                        doc.querySelector('meta[name="twitter:image"]')?.content ||
                        doc.querySelector('link[rel="image_src"]')?.href;
            }

            // 3. חיפוש עמוק בגוף הכתבה
            if (!image) {
                const images = Array.from(doc.querySelectorAll('article img, main img, .content img, img'));
                const bestImg = images.find(img => {
                    const src = img.getAttribute('src');
                    // סינון תמונות זבל (אייקונים, פיקסלים, לוגואים)
                    if (!src || !src.startsWith('http') || src.includes('svg') || src.includes('logo') || src.includes('icon') || src.includes('pixel')) return false;
                    
                    // בדיקת גודל אם קיים
                    const w = img.getAttribute('width');
                    if (w && parseInt(w) < 200) return false;
                    
                    return true;
                });
                if (bestImg) image = bestImg.src;
            }

            // תיקוני URL
            if (image && image.startsWith('//')) {
                image = 'https:' + image;
            }

            // חילוץ תקציר
            description = doc.querySelector('meta[property="og:description"]')?.content ||
                          doc.querySelector('meta[name="description"]')?.content;

            if (!description || description.length < 50) {
                const paragraphs = doc.querySelectorAll('p');
                for (let p of paragraphs) {
                    if (p.textContent.length > 80 && !p.textContent.includes('cookie')) {
                        description = p.textContent.substring(0, 300) + '...';
                        break;
                    }
                }
            }

            return { image, summary: description };

        } catch (e) {
            console.error("Enrichment error:", e);
            return { image: null, summary: null };
        }
    }
}
