import { NetworkService } from './NetworkService';
import { ContentProcessor } from './ContentProcessor';
import { MASTER_FEED_URL, EUROMIX_HEADERS } from '../config/constants';

export class ScraperEngine {
    static async getMasterFeed() {
        const html = await NetworkService.fetch(MASTER_FEED_URL);
        if (!html) return [];
        
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const container = doc.querySelector('main') || doc.body;
        
        let sourceMap = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        while(walker.nextNode()) {
            const val = walker.currentNode.nodeValue.trim();
            const matchedHeader = EUROMIX_HEADERS.find(h => val.toLowerCase().includes(h.toLowerCase()));
            if(matchedHeader) sourceMap.push({ node: walker.currentNode.parentNode, name: matchedHeader });
        }

        const links = Array.from(container.querySelectorAll('a[href]'));
        const articlesFound = [];

        links.forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();
            if (!href || href.length < 15 || !href.startsWith('http')) return;
            if (text.length < 5 || href.includes('wp-rss-aggregator') || text.includes('אבי זייקנר')) return;

            let source = "מקור כללי";
            for (let s of sourceMap) {
                if (s.node.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    source = s.name;
                }
            }

            let pubDate = new Date().toISOString();
            let contextText = (link.nextSibling?.textContent || "") + (link.parentElement?.textContent || "");
            const dateMatch = contextText.match(/Published on\s+(\d+)\s+(day|hour|minute)s?\s+ago/i);
            
            if (dateMatch) {
                const amount = parseInt(dateMatch[1]);
                const d = new Date();
                if (dateMatch[0].includes('day')) d.setDate(d.getDate() - amount);
                else d.setHours(d.getHours() - amount);
                pubDate = d.toISOString();
            }

            articlesFound.push({
                source, title: text, link: href,
                originLang: ContentProcessor.detectLanguage(text),
                pubDate, img: null, snippet: null
            });
        });
        
        const uniqueMap = new Map();
        articlesFound.forEach(item => { if(!uniqueMap.has(item.link)) uniqueMap.set(item.link, item); });
        return Array.from(uniqueMap.values());
    }

    static async getRedditFeed() {
        try {
            const jsonStr = await NetworkService.fetch('[https://www.reddit.com/r/eurovision/new.json?limit=15](https://www.reddit.com/r/eurovision/new.json?limit=15)');
            if (!jsonStr) return [];
            const json = JSON.parse(jsonStr);
            return json.data.children.map(c => ({
                source: 'Reddit (r/eurovision)',
                title: c.data.title,
                link: `https://www.reddit.com${c.data.permalink}`,
                originLang: 'English',
                pubDate: new Date(c.data.created_utc * 1000).toISOString(),
                img: c.data.thumbnail?.startsWith('http') ? c.data.thumbnail : null,
                snippet: c.data.selftext || ''
            }));
        } catch { return []; }
    }
}
