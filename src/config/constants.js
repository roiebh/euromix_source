export const APP_ID = 'euromix-pro-v3';
export const MASTER_FEED_URL = "[https://www.euromix.co.il/a123/](https://www.euromix.co.il/a123/)";

export const DEFAULT_TEAM = [
  { name: 'דניאל', email: 'daniel@euromix.co.il', role: 'עורך' },
  { name: 'מור', email: 'mor@euromix.co.il', role: 'כתב' },
  { name: 'אבי', email: 'avi@euromix.co.il', role: 'כתב' },
  { name: 'טל', email: 'tal@euromix.co.il', role: 'מנהל סושיאל' },
  { name: 'שחר', email: 'shachar@euromix.co.il', role: 'עורך' }
];

export const EUROMIX_HEADERS = [
    "Euromix.co.il", "Srgsse.ch - Official Swiss Website", "Eurovision.tv", "Eurovoix.com", "Eurovisionfun.com", 
    "wiwibloggs.com", "Esctoday.com", "Escportugal.pt", "Songfestival.be", "Ogaegreece.com", "Eurofestivalnews.com", 
    "Eurovision-spain.com", "Escplus.es", "Eurofestivales.blogspot.com", "Eurowizja.org", "Eurovision.de", 
    "Thateurovisionsite.com", "Escxtra.com", "Escunited.com", "Jauns.lv", "Dziennik-eurowizyjny.pl", "Escnorge.no", 
    "Esc-kompakt.de", "Vadeeurovision.es", "Euroalfa.eu", "Eurosong.hr", "Escbeat.com", "Escbubble.com", "Eurovoxx.tv", 
    "Eurovision-contest.ru", "Eurovision-quotidien.com", "Eurovision.tvr.ro", "Evrovizija.com", "Aussievision.net"
];

export const DEFAULT_SOURCES = [
    { name: 'Euromix', query: 'site:euromix.co.il', type: 'site' },
    { name: 'Reddit/Eurovision', query: 'reddit.com', type: 'social' },
    ...EUROMIX_HEADERS.map(h => ({ name: h, type: 'detected' }))
];

export const EUROVISION_FACTS = [
    "הידעת? אירלנד ושוודיה הן שיאניות הזכיות באירוויזיון עם 7 זכיות כל אחת.",
    "השיר הקצר ביותר בתולדות האירוויזיון נמשך דקה ו-27 שניות בלבד (פינלנד 2015).",
    "בשנת 1969, ארבע מדינות זכו במקום הראשון בתיקו: ספרד, בריטניה, הולנד וצרפת.",
    "אוסטרליה משתתפת באירוויזיון מאז 2015, למרות שאינה באירופה.",
    "השיר 'Waterloo' של אבבא זכה ב-1974 והזניק את הקריירה הבינלאומית שלהם.",
    "ישראל זכתה 4 פעמים: 1978, 1979, 1998 ו-2018.",
    "נורווגיה מחזיקה בשיא המפוקפק של 0 נקודות הכי הרבה פעמים (4 פעמים)."
];
