const cheerio=require('cheerio');const {esc,safeUrl}=require('./content');
const moreDescriptions={'/blog.html':'Guides & insights','/testimonials.html':'Student video stories','/career-test.html':'Find your course direction','/placement-assistance.html':'Contact career support'};
const moreDefault=[{label:'Blog',url:'/blog.html'},{label:'Testimonials',url:'/testimonials.html'},{label:'Career Test',url:'/career-test.html'},{label:'Placement Assistance',url:'/placement-assistance.html'}];
function config(s){const header={logoUrl:s.logoUrl||'/assets/favicon.svg',applyText:'Apply Now',applyUrl:'/admissions.html',whatsappText:'◌ WhatsApp',showWhatsapp:true,showApply:true,moreText:'More',moreLinks:moreDefault,logoWidth:220,mobileLogoWidth:148,...s.header};const footer={logoUrl:s.logoUrl||'/assets/favicon.svg',quickTitle:'QUICK LINKS',coursesTitle:'COURSES',contactTitle:'CONTACT',newsletterTitle:'NEWSLETTER',newsletterPlaceholder:'Email address',newsletterButton:'Go',showNewsletter:true,copyright:'Logic School of Management. All rights reserved.',legalLinks:[{label:'Privacy Policy',url:'/privacy.html'},{label:'Payment & Refund Policy',url:'/refund-policy.html'}],logoWidth:230,mobileLogoWidth:195,quickLinks:[...(s.navigation||[]).filter(x=>x.label!=='Contact'),...moreDefault],...s.footer};return {header,footer};}
const allowed={header:['logoUrl','applyText','applyUrl','whatsappText','showWhatsapp','showApply','moreText','moreLinks','logoWidth','mobileLogoWidth'],footer:['logoUrl','quickTitle','coursesTitle','contactTitle','newsletterTitle','newsletterPlaceholder','newsletterButton','showNewsletter','copyright','legalLinks','logoWidth','mobileLogoWidth','quickLinks']};
function validate(part,input){if(!allowed[part]||!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid layout');const result={};for(const key of allowed[part]){if(!(key in input))continue;const v=input[key];if(['moreLinks','legalLinks','quickLinks'].includes(key)){if(!Array.isArray(v)||v.length>30)throw Error('Use up to 30 links');result[key]=v.map(x=>{if(!String(x.label||'').trim()||!x.url)throw Error('Each link needs a label and URL');return {label:String(x.label).trim().slice(0,100),url:safeUrl(x.url)};});}else if(['logoWidth','mobileLogoWidth'].includes(key)){const n=Number(v);if(!Number.isFinite(n)||n<80||n>320)throw Error('Logo width must be between 80 and 320 pixels');result[key]=n;}else if(key.startsWith('show'))result[key]=!!v;else result[key]=key.endsWith('Url')?safeUrl(v):String(v||'').slice(0,1000);}return result;}
function hydrate(markup,name,s){const $=cheerio.load(markup,null,false),cfg=config(s),h=cfg.header,f=cfg.footer;
 $('.brand').addClass('has-logo').html(`<img class="site-logo" src="${esc(cfg[name].logoUrl||s.logoUrl||'/assets/favicon.svg')}" alt="${esc(s.siteName||'Logic School of Management')}">`);
 const phone=String(s.phone||'+91 98958 18581'),wa=String(s.whatsapp||'919895818581').replace(/\D/g,'');
 $('a[href^="tel:"]').attr('data-global-phone','').attr('href','tel:'+phone.replace(/[^+\d]/g,'')).text(phone);$('a[href^="mailto:"]').attr('data-global-email','').attr('href','mailto:'+(s.email||'info@logiceducation.org')).text(s.email||'info@logiceducation.org');
 const links=(items,cls='')=>items.map(x=>`<a${cls?` class="${cls}"`:''} href="${esc(x.url)}">${esc(x.label)}</a>`).join('');
 if(name==='header'){
 $('.site-header').attr('data-layout-managed','').attr('style',`--header-logo-width:${h.logoWidth}px;--header-logo-mobile:${h.mobileLogoWidth}px`);
 if(Array.isArray(s.navigation))$('.desktop-nav,.mobile-nav').html(links(s.navigation,'nav-link'));
 $('.desktop-nav,.mobile-nav').attr('data-layout-managed','');
 if(h.moreLinks.length){$('.desktop-nav').append(`<div class="nav-resource-menu"><button class="nav-link nav-more-button" type="button" aria-haspopup="true" aria-expanded="false">${esc(h.moreText)} <span>⌄</span></button><div class="nav-more-panel">${h.moreLinks.map(x=>`<a href="${esc(x.url)}"><b>${esc(x.label)}</b>${moreDescriptions[x.url]?`<small>${esc(moreDescriptions[x.url])}</small>`:''}</a>`).join('')}</div></div>`);}
 if(h.showApply){$('.nav-actions .btn').text(h.applyText).attr('href',h.applyUrl);$('.mobile-nav').append(`<a href="${esc(h.applyUrl)}">${esc(h.applyText)}</a>`);}else $('.nav-actions .btn').remove();
 if(h.showWhatsapp){$('.whatsapp-link').text(h.whatsappText).attr('href','https://wa.me/'+wa);$('.mobile-nav').append(`<a href="https://wa.me/${wa}">${esc(h.whatsappText)}</a>`);}else $('.whatsapp-link').remove();
 if(h.moreLinks.length)$('.mobile-nav').append(links(h.moreLinks));
 }else{
 $('.footer').attr('data-layout-managed','').attr('style',`--footer-logo-width:${f.logoWidth}px;--footer-logo-mobile:${f.mobileLogoWidth}px`);
 if('tagline'in s)$('.footer-grid>div:first-child>p').text(s.tagline);
 if('address'in s)$('.footer-grid>div:last-child>p').text(s.address);
 $('.footer-grid>div:nth-child(2)').html(`<h4>${esc(f.quickTitle)}</h4>`+links(f.quickLinks));
 $('.footer-grid>div:nth-child(3)>h4').text(f.coursesTitle);if(Array.isArray(s.footerCourses))$('.footer-grid>div:nth-child(3)').html(`<h4>${esc(f.coursesTitle)}</h4>`+links(s.footerCourses));
 $('.footer-grid>div:last-child>h4').first().text(f.contactTitle);
 if(f.showNewsletter){$('.newsletter-title').text(f.newsletterTitle);$('.newsletter input').attr('placeholder',f.newsletterPlaceholder);$('.newsletter button').text(f.newsletterButton);}else $('.newsletter-title,.newsletter').remove();
 $('.footer-bottom>span').first().html(`© <span data-year>${new Date().getFullYear()}</span> ${esc(f.copyright)}`);$('.footer-bottom>span').last().html(links(f.legalLinks));
 const social=Array.isArray(s.socialLinks)?s.socialLinks:[];if(Array.isArray(s.socialLinks))$('.social-row').html(social.map(x=>`<a class="social-link-box" href="${esc(x.url||'#')}" aria-label="${esc(x.label)}" target="_blank" rel="noopener" data-fit="${x.fit==='cover'?'cover':'contain'}">${x.iconUrl?`<img class="social-link-image" src="${esc(x.iconUrl)}" alt="">`:`<span class="social-link-fallback">${esc((x.label||'').slice(0,2).toUpperCase())}</span>`}</a>`).join(''));
 }
 return $.html();
}
module.exports={config,validate,hydrate};
