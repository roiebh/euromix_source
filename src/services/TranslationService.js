import { NetworkService } from './NetworkService';

export class TranslationService {
    static async translate(text, targetLang) {
        if (!text || text.length < 2) return { text: text || "", lang: "unknown" };
        
        // אם הטקסט כבר בעברית וביקשו עברית, אין צורך לתרגם
        if (targetLang === 'iw' && /[\u0590-\u05FF]/.test(text)) {
            return { text: text, lang: 'he' };
        }

        try {
            const tl = targetLang === 'he' ? 'iw' : targetLang;
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text.substring(0, 1500))}`;
            
            const raw = await NetworkService.fetch(url);
            
            if (raw) {
                let data;
                try { data = JSON.parse(raw); } catch { return { text: text, lang: 'error' }; }
                
                if (data && data[0]) {
                    const translatedText = data[0].map(x => x[0]).join('');
                    return { text: translatedText, lang: targetLang };
                }
            }
        } catch (e) { console.error("Translate error", e); }
        
        return { text: text, lang: 'error' }; 
    }
}
