const fs=require('fs'),path=require('path'),cheerio=require('cheerio');const {root}=require('./db');const c=require('./content');const publicUrls=require('./public-urls');
function shared(html,settings){for(const name of ['header','footer']){const markup=require('./layout').hydrate(fs.readFileSync(path.join(root,'partials',name+'.html'),'utf8'),name,settings);html=html.replace(new RegExp(`<!--\\s*SHARED:${name}\\s*-->`,'g'),()=>markup);}return html;}
async function page(html,db,settings,pathname=''){html=shared(html,settings);
 if(html.includes('CONTENT:programs'))html=html.replace(/<!--\s*CONTENT:programs\s*-->/g,()=>`<!-- CMS:programs:start -->${db.cache.programs.map(c.program).join('')}<!-- CMS:programs:end -->`);
 if(html.includes('CONTENT:blog'))html=html.replace(/<!--\s*CONTENT:blog\s*-->/g,()=>`<!-- CMS:blog:start -->${db.cache.blog_posts.filter(p=>p.status==='published').sort((a,b)=>(b.publishedDate||'').localeCompare(a.publishedDate||'')).map(c.blogCard).join('')}<!-- CMS:blog:end -->`);
 if(html.includes('CONTENT:categories'))html=html.replace(/<!--\s*CONTENT:categories\s*-->/g,()=>`<!-- CMS:categories:start -->${db.cache.result_categories.map(c.category).join('')}<!-- CMS:categories:end -->`);
 const $=cheerio.load(html);require('./gallery').apply($,db.cache,pathname);$('a[href^="tel:"]').each((i,e)=>{if(!$(e).closest('.branch-card,.office-card,.campus-card').length&&$(e).attr('href').replace(/\D/g,'')==='919895818581')$(e).attr('data-global-phone','');});
 $('form[data-form],form[data-career-test]').each((i,e)=>{if(!$(e).find('[name="website"]').length)$(e).append('<label class="form-honeypot" aria-hidden="true">Leave this blank<input name="website" tabindex="-1" autocomplete="off"></label>');if(!$(e).find('.form-status').length)$(e).append('<p class="form-status" aria-live="polite"></p>');});
 $('img').each((i,e)=>{if(!$(e).closest('.site-header,.home-hero').length)$(e).attr('loading','lazy');$(e).attr('decoding','async');});
 if(!$('#logic-loader-script').length)$('head').append('<script id="logic-loader-script" src="/assets/enhancements.js" defer></script>');
 $('head').append('<link rel="stylesheet" href="/assets/enhancements.css">');
 $('body').prepend(`<div id="logic-loader" hidden aria-hidden="true"><img src="${c.esc(settings.logoUrl||'/assets/favicon.svg')}" alt=""></div><script data-runtime>(function(){var el=document.getElementById('logic-loader');if(!el)return;el.hidden=false;function done(){el.classList.add('ready');setTimeout(function(){el.remove()},160)}document.addEventListener('DOMContentLoaded',done,{once:true});setTimeout(done,2000)})();</script>`);

 // Resolve legacy/CMS links against the physical page, without changing saved content.
 const origin=process.env.PUBLIC_ORIGIN||'https://logic.invalid';
 const source=publicUrls.sourcePath(pathname);
 for(const attr of ['href','src','action','poster'])$('['+attr+']').each((i,e)=>{const value=$(e).attr(attr);$(e).attr(attr,publicUrls.href(value,source,origin));});
 if(!$('#logic-public-urls').length)$('head').prepend('<script id="logic-public-urls" src="/assets/public-urls.js"></script>');
 // Bust the previous one-hour script cache when switching to clean routes.
 $('script[src]').each((i,e)=>{const src=$(e).attr('src').split('?')[0];if(['/assets/site.js','/assets/enhancements.js','/assets/public-urls.js'].includes(src))$(e).attr('src',src+'?v=clean-urls-1');});
 if(process.env.PUBLIC_ORIGIN&&publicUrls.canonicalPath(pathname)){
  const canonical=new URL(publicUrls.canonicalPath(pathname),origin).href;
  $('link[rel="canonical"]').remove();$('head').append('<link rel="canonical" href="'+c.esc(canonical)+'">');
  $('meta[property="og:url"]').attr('content',canonical);
 }
 return $.html();
}
function normalize(html){for(const name of ['programs','blog','categories'])html=html.replace(new RegExp(`<!-- CMS:${name}:start -->[\\s\\S]*?<!-- CMS:${name}:end -->`,'g'),`<!-- CONTENT:${name} -->`);const $=cheerio.load(html);$('[data-shared="header"],header.site-header').replaceWith('<!-- SHARED:header -->');$('[data-shared="footer"],footer.footer').replaceWith('<!-- SHARED:footer -->');
 $('.program-grid:has([data-record-id])').html('<!-- CONTENT:programs -->');
 $('[data-gallery-managed],[data-logic-tracking],.image-lightbox,.video-modal,#logic-loader,[data-runtime],#logic-public-urls').remove();
 $('link[href="/assets/enhancements.css"]').remove();
 return $.html();}
function shell(title,body){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.esc(title)} | Logic School of Management</title><link rel="icon" href="/assets/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/styles.css"><script>window.LOGIC_ROOT='/'</script><script defer src="/assets/config.js"></script><script defer src="/assets/site.js"></script></head><body><!-- SHARED:header -->${body}<!-- SHARED:footer --></body></html>`;}
module.exports={page,normalize,shell,shared};
