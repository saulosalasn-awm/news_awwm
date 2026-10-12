const Parser = require('rss-parser');
const parser = new Parser({timeout:8500,customFields:{item:[['media:content','mediaContent',{keepArray:true}],['media:thumbnail','mediaThumbnail',{keepArray:true}]]}});
const feeds = [
 {url:'https://www.eleconomista.com.mx/rss/',publisher:'El Economista',cat:'México'},
 {url:'https://www.cnbc.com/id/100003114/device/rss/rss.html',publisher:'CNBC',cat:'Bolsas'},
 {url:'https://feeds.bbci.co.uk/mundo/rss.xml',publisher:'BBC News Mundo',cat:'Global'},
 {url:'https://news.google.com/rss/search?q=USD%2FMXN%20Banxico%20when%3A3d&hl=es-419&gl=MX&ceid=MX:es-419',publisher:'Google Noticias',cat:'Divisas'},
 {url:'https://news.google.com/rss/search?q=Federal%20Reserve%20Treasury%20when%3A3d&hl=es-419&gl=MX&ceid=MX:es-419',publisher:'Google Noticias',cat:'Tasas EE. UU.'}
];
function imageUrl(it){let options=[];if(it.enclosure?.type?.startsWith('image/'))options.push(it.enclosure.url);for(const k of ['mediaContent','mediaThumbnail']){const v=it[k];for(const o of Array.isArray(v)?v:v?[v]:[]){options.push(o?.$?.url,o?.url)}}for(const u of options){try{let x=new URL(u);if(x.protocol==='https:'&&/\.(jpg|jpeg|png|webp)$/i.test(x.pathname))return x.href}catch{}}return null}
exports.handler=async()=>{
 let settled=await Promise.allSettled(feeds.map(async f=>{let data=await parser.parseURL(f.url);return (data.items||[]).slice(0,15).map(it=>{let source=it.source?.name||it.source?.title||f.publisher;let title=(it.title||'').trim();if(f.publisher==='Google Noticias'){const bits=title.match(/^(.*) - ([^-]+)$/);if(bits){title=bits[1];source=bits[2].trim()}}return {title,publisher:source,date:it.isoDate||it.pubDate||'',url:it.link||'',image:imageUrl(it),cat:f.cat}}).filter(x=>x.title&&/^https:\/\//.test(x.url)&&!Number.isNaN(Date.parse(x.date)))}));
 let dedup=new Set(),news=settled.filter(x=>x.status==='fulfilled').flatMap(x=>x.value).filter(x=>{let id=x.title.toLocaleLowerCase().replace(/\W/g,'').slice(0,90);if(dedup.has(id))return false;dedup.add(id);return true}).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,50);
 return {statusCode:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=180, s-maxage=600','access-control-allow-origin':'*'},body:JSON.stringify({news,availableFeeds:settled.filter(x=>x.status==='fulfilled').length,totalFeeds:feeds.length,updatedAt:new Date().toISOString()})};
};
