export class NetworkService {
    // רשימת פרוקסי לגיבוי ורוטציה
    static proxies = [
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];

    static async delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    static async fetch(url, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            for (const proxyGen of this.proxies) {
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 8000); // 8 שניות טיימאאוט
                    
                    const targetUrl = proxyGen(url);
                    const res = await fetch(targetUrl, { signal: controller.signal });
                    clearTimeout(id);
                    
                    if (res.status === 429 || res.status === 503) {
                        await this.delay(1000 * (attempt + 1));
                        continue; // נסה פרוקסי הבא
                    }

                    if (res.ok) return await res.text();
                    
                } catch (e) { 
                    // התעלם משגיאה ונסה פרוקסי הבא
                }
            }
            await this.delay(1000);
        }
        return null;
    }
}
