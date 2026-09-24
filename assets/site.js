
(()=>{
  const root=window.LOGIC_ROOT||'';
  const trackingConfig=window.LOGIC_TRACKING||{};
  function logicTrack(eventName,params={}){
    if(!trackingConfig.enabled||!eventName)return;
    const contactEvent=eventName==='whatsapp_click'||eventName==='call_click';
    if(contactEvent&&trackingConfig.trackContactClicks===false)return;
    if(!contactEvent&&trackingConfig.trackConversions===false)return;
    const clean={};
    for(const [k,v] of Object.entries(params||{})){
      if(v==null||v==='')continue;
      if(['string','number','boolean'].includes(typeof v))clean[k]=v;
    }
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push({event:eventName,...clean});
    if(typeof window.gtag==='function')window.gtag('event',eventName,clean);
    if(typeof window.fbq==='function'){
      if(eventName==='lead_submit'||eventName==='brochure_lead')window.fbq('track','Lead',clean);
      else if(eventName==='newsletter_subscribe')window.fbq('track','CompleteRegistration',clean);
      else window.fbq('trackCustom',eventName,clean);
    }
  }
  window.logicTrack=logicTrack;


  const motionDefaults={enabled:true,respectReducedMotion:true,once:true,preset:'fade-up',duration:480,delay:0,distance:14,stagger:45,threshold:.05,easing:'cubic-bezier(0.22, 1, 0.36, 1)',autoSections:false,autoCards:true,autoText:false,autoImages:false,autoButtons:false,customSelectors:'',smoothScroll:true,cardHover:true,imageHover:true,buttonHover:true,premiumSpotlight:true,magneticButtons:true,countUp:true,scrollProgress:true,heroParallax:true};
  function applyAnimationSettings(value){
    const a={...motionDefaults,...(value||{})};
    const html=document.documentElement,body=document.body;if(!body)return;
    html.classList.toggle('logic-smooth-scroll',!!a.smoothScroll);
    body.classList.toggle('logic-hover-card',!!a.cardHover);body.classList.toggle('logic-hover-image',!!a.imageHover);body.classList.toggle('logic-hover-button',!!a.buttonHover);
    applyPremiumInteractions(a);
    if(!a.enabled){html.classList.remove('logic-motion-enabled');document.querySelectorAll('.logic-animate').forEach(el=>{el.classList.add('logic-visible')});return}
    if(a.respectReducedMotion&&window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){html.classList.remove('logic-motion-enabled');return}
    html.classList.add('logic-motion-enabled');
    html.style.setProperty('--logic-motion-duration',`${Math.max(100,Number(a.duration)||700)}ms`);html.style.setProperty('--logic-motion-distance',`${Math.max(0,Number(a.distance)||0)}px`);html.style.setProperty('--logic-motion-easing',a.easing||'ease-out');
    const selectors=[];
    if(a.autoSections)selectors.push('main > .section','main > section.section','.callback-band','.career-banner','.course-hero','.page-hero');
    if(a.autoCards)selectors.push('.program-card','.course-full-card','.branch-card','.stat-box','.result-card','.result-item','.content-card','.quick-facts','.lead-form','.mission-grid > div','.timeline > div','.mini-stat-grid > div','.large-stat-grid > div','.campus-card','.blog-card','.testimonial-video-card','.placement-feature-card','.result-poster-card','.career-test-shell','.assistance-panel','.article-callout');
    if(a.autoText)selectors.push('.hero-copy > *','.page-hero .container > *','.course-hero-grid > div:first-child > *','.section-head > *');
    if(a.autoImages)selectors.push('main img:not(.site-logo)');
    if(a.autoButtons)selectors.push('main .btn','main button','main .text-button');
    String(a.customSelectors||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean).forEach(x=>selectors.push(x));
    const targets=new Set(document.querySelectorAll('[data-logic-animation]'));
    for(const sel of selectors){try{document.querySelectorAll(sel).forEach(el=>targets.add(el))}catch(e){}}
    let i=0;for(const el of targets){
      const explicit=el.getAttribute('data-logic-animation');if(explicit==='none'){el.classList.remove('logic-animate');continue}
      const effect=explicit||a.preset||'fade-up';const duration=Math.max(100,Number(el.getAttribute('data-logic-duration'))||Number(a.duration)||700);const distance=Math.max(0,Number(el.getAttribute('data-logic-distance'))||Number(a.distance)||0);const ownDelay=el.hasAttribute('data-logic-delay')?Math.max(0,Number(el.getAttribute('data-logic-delay'))||0):Math.max(0,Number(a.delay)||0)+((i%8)*Math.max(0,Number(a.stagger)||0));
      el.classList.add('logic-animate');el.dataset.logicEffect=effect;el.style.setProperty('--logic-item-duration',duration+'ms');el.style.setProperty('--logic-item-delay',ownDelay+'ms');el.style.setProperty('--logic-item-distance',distance+'px');i++;
    }
    const list=[...targets].filter(el=>el.classList.contains('logic-animate'));
    // Never leave content that is already on screen invisible while waiting for a scroll event.
    // This is especially important for CMS-added images/cards and for tall sections near the fold.
    const revealInInitialViewport=el=>{const r=el.getBoundingClientRect();const margin=96;return r.bottom>=-margin&&r.top<=innerHeight+margin};
    list.forEach(el=>{if(revealInInitialViewport(el))el.classList.add('logic-visible')});
    if(!('IntersectionObserver'in window)){list.forEach(el=>el.classList.add('logic-visible'));return}
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('logic-visible');if(a.once)observer.unobserve(entry.target)}else if(!a.once){entry.target.classList.remove('logic-visible')}})},{threshold:Math.min(1,Math.max(0,Number(a.threshold)||0)),rootMargin:'96px 0px'});
    list.forEach(el=>{if(el.classList.contains('logic-visible')&&a.once)return;observer.observe(el)});
  }

  const premiumState={spotlight:false,magnetic:false,countUp:false,heroParallax:false,scrollProgress:false};
  const prefersReduced=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ensureScrollProgress(){
    let bar=document.querySelector('.logic-scroll-progress');
    if(!bar){bar=document.createElement('div');bar.className='logic-scroll-progress';bar.setAttribute('aria-hidden','true');bar.innerHTML='<i></i>';document.body.prepend(bar)}
    return bar;
  }
  function updateScrollProgress(){
    const bar=document.querySelector('.logic-scroll-progress');if(!bar||bar.hidden)return;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);const pct=Math.min(100,Math.max(0,(scrollY/max)*100));bar.style.setProperty('--logic-scroll',pct+'%');
  }
  function initPremiumSpotlight(){
    if(premiumState.spotlight)return;premiumState.spotlight=true;
    const selector='.program-card,.course-full-card,.branch-card,.result-aggregate>div,.large-stat-grid>div,.mini-stat-grid>div,.mission-grid>div,.timeline>div,.campus-tile,.content-card,.office-card,.career-panel,.quick-facts,.course-content-grid aside .lead-form,.blog-card,.testimonial-video-card,.placement-feature-card,.result-poster-card,.career-test-shell,.assistance-panel,.article-callout';
    document.querySelectorAll(selector).forEach(card=>{
      card.classList.add('premium-spotlight');
      card.addEventListener('pointermove',e=>{if(!document.body.classList.contains('premium-spotlight-on'))return;const r=card.getBoundingClientRect();card.style.setProperty('--spot-x',(e.clientX-r.left)+'px');card.style.setProperty('--spot-y',(e.clientY-r.top)+'px')},{passive:true});
    });
  }
  function initMagneticButtons(){
    if(premiumState.magnetic)return;premiumState.magnetic=true;
    document.querySelectorAll('.btn,.text-button,.filter-chip').forEach(el=>{
      el.classList.add('premium-magnetic');
      el.addEventListener('pointermove',e=>{if(!document.body.classList.contains('premium-magnetic-on'))return;const r=el.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*.11,y=(e.clientY-r.top-r.height/2)*.11;el.style.translate=`${x}px ${y}px`},{passive:true});
      el.addEventListener('pointerleave',()=>{el.style.translate='0 0'},{passive:true});
    });
  }
  function initCountUps(){
    if(premiumState.countUp)return;premiumState.countUp=true;
    const els=[...document.querySelectorAll('.stat-card b,.result-aggregate b,.large-stat-grid b,.mini-stat-grid b,.metric-card b')];
    const parse=(txt)=>{const raw=txt.trim();const m=raw.match(/^([\d,.]+)(K|M)?(\+)?$/i);if(!m)return null;let n=Number(m[1].replace(/,/g,''));if(!Number.isFinite(n))return null;return {n,suffix:(m[2]||'')+(m[3]||''),commas:m[1].includes(',')}};
    const animate=el=>{if(el.dataset.logicCounted)return;const info=parse(el.textContent);if(!info)return;el.dataset.logicCounted='1';if(prefersReduced()){return}const final=info.n,duration=1150,start=performance.now(),format=n=>{const v=Math.round(n);return (info.commas?v.toLocaleString('en-IN'):String(v))+info.suffix};const tick=t=>{const p=Math.min(1,(t-start)/duration),e=1-Math.pow(1-p,4);el.textContent=format(final*e);if(p<1)requestAnimationFrame(tick);else el.textContent=(info.commas?final.toLocaleString('en-IN'):String(final))+info.suffix};requestAnimationFrame(tick)};
    if(!('IntersectionObserver'in window)){els.forEach(animate);return}const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){animate(x.target);io.unobserve(x.target)}}),{threshold:.35});els.forEach(el=>io.observe(el));
  }
  function initHeroParallax(){
    if(premiumState.heroParallax)return;premiumState.heroParallax=true;
    document.querySelectorAll('.home-hero,.course-hero').forEach(hero=>{
      hero.addEventListener('pointermove',e=>{if(!document.body.classList.contains('premium-hero-parallax-on'))return;const r=hero.getBoundingClientRect();const x=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100));const y=Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100));if(hero.classList.contains('course-hero')){hero.style.setProperty('--course-x',x+'%');hero.style.setProperty('--course-y',y+'%')}else{hero.style.setProperty('--hero-x',x+'%');hero.style.setProperty('--hero-y',y+'%')}},{passive:true});
      hero.addEventListener('pointerleave',()=>{if(hero.classList.contains('course-hero')){hero.style.setProperty('--course-x','78%');hero.style.setProperty('--course-y','34%')}else{hero.style.setProperty('--hero-x','68%');hero.style.setProperty('--hero-y','30%')}},{passive:true});
    });
  }
  function applyPremiumInteractions(a){
    const reduced=!!a.respectReducedMotion&&prefersReduced();document.body.classList.add('premium-ui');
    document.body.classList.toggle('premium-spotlight-on',!!a.premiumSpotlight&&!reduced);document.body.classList.toggle('premium-magnetic-on',!!a.magneticButtons&&!reduced);document.body.classList.toggle('premium-hero-parallax-on',!!a.heroParallax&&!reduced);
    if(a.premiumSpotlight)initPremiumSpotlight();if(a.magneticButtons)initMagneticButtons();if(a.heroParallax)initHeroParallax();if(a.countUp)initCountUps();
    const progress=ensureScrollProgress();progress.hidden=!a.scrollProgress;if(a.scrollProgress){updateScrollProgress();if(!premiumState.scrollProgress){premiumState.scrollProgress=true;addEventListener('scroll',updateScrollProgress,{passive:true});addEventListener('resize',updateScrollProgress,{passive:true})}}
  }

  function applyTypographySettings(typography){
    const defaults={enabled:false,h1Size:80,h1MobileSize:52,h1Weight:800,h2Size:56,h2MobileSize:38,h2Weight:800,h3Size:20,h3MobileSize:18,h3Weight:700,bodySize:14,bodyMobileSize:14,bodyWeight:400,navSize:12,navWeight:700,buttonSize:13,buttonWeight:800,labelSize:10,labelWeight:800};
    const x={...defaults,...(typography||{})},existing=document.getElementById('logic-typography-settings');
    if(!x.enabled){existing?.remove();return}
    const num=(v,min,max,f)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):f;
    const weight=(v,f)=>{const n=Math.round(num(v,300,900,f)/100)*100;return Math.min(900,Math.max(300,n))};
    const v={h1:num(x.h1Size,32,120,80),h1m:num(x.h1MobileSize,28,90,52),h1w:weight(x.h1Weight,800),h2:num(x.h2Size,24,90,56),h2m:num(x.h2MobileSize,22,70,38),h2w:weight(x.h2Weight,800),h3:num(x.h3Size,14,48,20),h3m:num(x.h3MobileSize,14,40,18),h3w:weight(x.h3Weight,700),body:num(x.bodySize,10,24,14),bodym:num(x.bodyMobileSize,10,22,14),bodyw:weight(x.bodyWeight,400),nav:num(x.navSize,9,22,12),navw:weight(x.navWeight,700),button:num(x.buttonSize,9,24,13),buttonw:weight(x.buttonWeight,800),label:num(x.labelSize,7,18,10),labelw:weight(x.labelWeight,800)};
    const style=existing||document.createElement('style');style.id='logic-typography-settings';style.textContent=`
      h1{font-size:${v.h1}px!important;font-weight:${v.h1w}!important}
      h2{font-size:${v.h2}px!important;font-weight:${v.h2w}!important}
      h3{font-size:${v.h3}px!important;font-weight:${v.h3w}!important}
      p{font-size:${v.body}px!important;font-weight:${v.bodyw}!important}
      .nav-link,.mobile-nav a{font-size:${v.nav}px!important;font-weight:${v.navw}!important}
      .btn,.text-button,.form-submit{font-size:${v.button}px!important;font-weight:${v.buttonw}!important}
      .eyebrow,.mini-label,.course-tag,.lead-form label,.contact-form label{font-size:${v.label}px!important;font-weight:${v.labelw}!important}
      @media(max-width:768px){h1{font-size:${v.h1m}px!important}h2{font-size:${v.h2m}px!important}h3{font-size:${v.h3m}px!important}p{font-size:${v.bodym}px!important}}
    `;if(!existing)document.head.appendChild(style);
  }

  function ensureResourceNavigation(){
    const items=[['Blog','/blog.html'],['Testimonials','/testimonials.html'],['Career Test','/career-test.html'],['Placement Assistance','/placement-assistance.html']];
    const path='/' + location.pathname.replace(/^\/+/, '');
    document.querySelectorAll('.desktop-nav').forEach(nav=>{
      if(nav.querySelector('.nav-resource-menu'))return;
      const wrap=document.createElement('div');wrap.className='nav-resource-menu';
      const active=items.some(([,url])=>path===url);
      wrap.innerHTML=`<button class="nav-link nav-more-button${active?' active':''}" type="button" aria-haspopup="true" aria-expanded="false">More <span>⌄</span></button><div class="nav-more-panel">${items.map(([label,url])=>`<a class="${path===url?'active':''}" href="${url}"><b>${label}</b><small>${label==='Blog'?'Guides & insights':label==='Testimonials'?'Student video stories':label==='Career Test'?'Find your course direction':'Contact career support'}</small></a>`).join('')}</div>`;
      nav.appendChild(wrap);
      const btn=wrap.querySelector('.nav-more-button');btn.addEventListener('click',()=>{const open=wrap.classList.toggle('open');btn.setAttribute('aria-expanded',String(open))});
    });
    document.querySelectorAll('.mobile-nav').forEach(nav=>{items.forEach(([label,url])=>{if(![...nav.querySelectorAll('a')].some(a=>a.getAttribute('href')===url)){const a=document.createElement('a');a.href=url;a.textContent=label;nav.appendChild(a)}})});
  }


  const brochureCourseNames={
    'ca':'CA','cma-india':'CMA India','ciap':'CIAP','acca':'ACCA','cma-usa':'CMA USA','cpa-usa':'CPA USA','ea':'EA','bcom-acca':'B.Com + ACCA','mba-acca':'MBA + ACCA','mcom-cpa':'M.Com + CPA','bat':'BAT Pro','dipifr':'DipIFR'
  };
  function ensureBrochureLeadModal(){
    let modal=document.querySelector('[data-brochure-gate]');if(modal)return modal;
    modal=document.createElement('div');modal.className='brochure-gate';modal.setAttribute('data-brochure-gate','');modal.hidden=true;
    modal.innerHTML=`<div class="brochure-gate-backdrop" data-brochure-close></div><section class="brochure-gate-card" role="dialog" aria-modal="true" aria-labelledby="brochure-gate-title"><button class="brochure-gate-close" type="button" data-brochure-close aria-label="Close">×</button><span class="eyebrow">GET THE BROCHURE</span><h2 id="brochure-gate-title">Where should we send your course support?</h2><p class="brochure-gate-copy">Enter your contact details to unlock the brochure. Your enquiry will also be available to the Logic admissions team.</p><form data-brochure-lead-form><label>FULL NAME<input name="name" autocomplete="name" required placeholder="Your full name"></label><label>MOBILE / WHATSAPP<input name="phone" autocomplete="tel" inputmode="tel" required placeholder="Mobile number"></label><label>EMAIL <span>(optional)</span><input name="email" type="email" autocomplete="email" placeholder="Email address"></label><label class="brochure-course-interest">COURSE INTEREST<select name="course"><option value="">Not sure yet</option>${Object.values(brochureCourseNames).map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label><label class="brochure-consent"><input name="consent" type="checkbox" required><span>I agree to be contacted by Logic School of Management about courses and admissions.</span></label><button class="btn btn-yellow brochure-gate-submit" type="submit">Submit & Download Brochure ↓</button><p class="brochure-gate-status" aria-live="polite"></p></form></section>`;
    document.body.appendChild(modal);
    const close=()=>{modal.hidden=true;document.body.classList.remove('brochure-modal-open');modal.querySelector('.brochure-gate-status').textContent=''};
    modal.querySelectorAll('[data-brochure-close]').forEach(x=>x.addEventListener('click',close));
    addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
    modal.querySelector('form').addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget,status=form.querySelector('.brochure-gate-status'),btn=form.querySelector('.brochure-gate-submit'),ctx=modal._brochureContext||{};
      status.textContent='Creating your download…';status.classList.remove('is-error');btn.disabled=true;
      const fd=new FormData(form);const payload=Object.fromEntries(fd.entries());payload.kind=ctx.kind||'master';payload.course=ctx.course||payload.course||'';payload.page=location.pathname;payload.consent=!!form.elements.consent?.checked;
      try{
        const res=await fetch(root+'api/brochure/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await res.json().catch(()=>({}));if(!res.ok||!data.ok)throw new Error(data.error||'Could not prepare the brochure');
        status.textContent='Thank you. Your brochure is downloading…';
        const eventData={course:payload.course||ctx.course||'All Courses',brochure_kind:payload.kind||'master',source:'Website Brochure',page:location.pathname};
        logicTrack('brochure_lead',eventData);
        const a=document.createElement('a');a.href=root+String(data.downloadUrl||'');a.style.display='none';document.body.appendChild(a);a.click();a.remove();
        logicTrack('brochure_download',eventData);
        form.reset();setTimeout(close,850);
      }catch(err){status.textContent=err.message||'Could not download right now. Please try again.';status.classList.add('is-error')}finally{btn.disabled=false}
    });
    return modal;
  }
  function openBrochureLeadGate(context){
    const modal=ensureBrochureLeadModal();modal._brochureContext=context||{};const select=modal.querySelector('.brochure-course-interest'),title=modal.querySelector('#brochure-gate-title');
    if(context?.course){select.hidden=true;title.textContent=`Download the ${context.course} brochure`;}else{select.hidden=false;title.textContent='Download the complete course brochure';}
    modal.hidden=false;document.body.classList.add('brochure-modal-open');setTimeout(()=>modal.querySelector('input[name="name"]')?.focus(),30);
  }
  function applyBrochureSettings(brochures){
    if(!brochures||typeof brochures!=='object')return;
    const addButton=(host,config,kind,course='')=>{if(!host||!config?.enabled||!config?.available)return;if(host.querySelector(`[data-brochure-download="${kind}"]`))return;const b=document.createElement('button');b.type='button';b.className='btn btn-outline brochure-download-button';b.setAttribute('data-brochure-download',kind);b.innerHTML=`${String(config.label||'Download Brochure')} <span aria-hidden="true">↓</span>`;b.addEventListener('click',()=>openBrochureLeadGate({kind,course}));host.appendChild(b)};
    const path=location.pathname.replace(/\/+$/,'');
    if(path===''||path==='/'||path.endsWith('/index.html')&&!path.includes('/courses/')) addButton(document.querySelector('.home-hero .hero-buttons'),brochures.master,'master','');
    const m=path.match(/\/courses\/([^/]+)\.html$/);if(m){const slug=m[1],cfg=brochures.courses?.[slug];addButton(document.querySelector('.course-hero .hero-buttons'),cfg,slug,brochureCourseNames[slug]||slug);}
  }

  async function applyPublicBrochureSettings(){
    try{
      const res=await fetch(root+'api/public/brochures',{cache:'no-store'});if(!res.ok)return;
      const payload=await res.json();applyBrochureSettings(payload.brochures||{});
    }catch(e){}
  }

  async function applyPublicSettings(){
    try{
      const res=await fetch(root+'api/public/settings',{cache:'no-store'}); if(!res.ok)return;
      const payload=await res.json(), s=payload.settings||{};
      if(s.primaryColor){document.documentElement.style.setProperty('--green',s.primaryColor);document.documentElement.style.setProperty('--green2',s.primaryColor);}
      if(s.secondaryColor) document.documentElement.style.setProperty('--yellow',s.secondaryColor);
      if(s.logoUrl){
        document.querySelectorAll('.brand').forEach(a=>{a.classList.add('has-logo');a.innerHTML=`<img class="site-logo" src="${s.logoUrl}" alt="${s.siteName||'Logic School of Management'}">`;});
      }
      if(s.faviconUrl){let icon=document.querySelector('link[rel="icon"]');if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon)}icon.href=s.faviconUrl;}
      if(s.phone){document.querySelectorAll('a[href^="tel:"]').forEach(a=>{a.href='tel:'+String(s.phone).replace(/[^+\d]/g,'');a.textContent=s.phone;});}
      if(s.email){document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{a.href='mailto:'+s.email;a.textContent=s.email;});}
      if(s.whatsapp){const num=String(s.whatsapp).replace(/\D/g,'');document.querySelectorAll('a[href*="wa.me/"]').forEach(a=>{const old=a.getAttribute('href')||'';const q=old.includes('?')?old.slice(old.indexOf('?')):'';a.href='https://wa.me/'+num+q;});}
      if(s.address){document.querySelectorAll('.footer-grid>div:last-child>p').forEach(p=>p.textContent=s.address);}
      if(s.tagline){document.querySelectorAll('.footer-grid>div:first-child>p').forEach(p=>p.textContent=s.tagline);}
      if(Array.isArray(s.navigation)&&s.navigation.length){
        const current='/' + location.pathname.replace(/^\/+/, '');
        const navHtml=s.navigation.map(x=>{const active=current===x.url||(x.url==='/courses/index.html'&&current.startsWith('/courses/'));return `<a class="nav-link${active?' active':''}" href="${x.url}">${x.label}</a>`}).join('');
        document.querySelectorAll('.desktop-nav').forEach(n=>n.innerHTML=navHtml);
        document.querySelectorAll('.mobile-nav').forEach(n=>n.innerHTML=navHtml+`<a href="/admissions.html">Apply Now</a><a href="https://wa.me/${String(s.whatsapp||'919895818581').replace(/\D/g,'')}">WhatsApp</a>`);
        document.querySelectorAll('.footer-grid>div:nth-child(2)').forEach(col=>{const h=col.querySelector('h4');col.innerHTML=(h?h.outerHTML:'<h4>QUICK LINKS</h4>')+s.navigation.filter(x=>x.label!=='Contact').map(x=>`<a href="${x.url}">${x.label}</a>`).join('');});
        document.querySelectorAll('.footer-grid>div:nth-child(2)').forEach(col=>{[['Blog','/blog.html'],['Testimonials','/testimonials.html'],['Career Test','/career-test.html'],['Placement Assistance','/placement-assistance.html']].forEach(([label,url])=>{if(![...col.querySelectorAll('a')].some(a=>a.textContent.trim()===label)){const a=document.createElement('a');a.href=url;a.textContent=label;col.appendChild(a)}})});
        ensureResourceNavigation();
      }
      if(Array.isArray(s.footerCourses)&&s.footerCourses.length){document.querySelectorAll('.footer-grid>div:nth-child(3)').forEach(col=>{const h=col.querySelector('h4');col.innerHTML=(h?h.outerHTML:'<h4>COURSES</h4>')+s.footerCourses.map(x=>`<a href="${x.url}">${x.label}</a>`).join('');});}
      const fallbackSocials=[{label:'Facebook',url:s.facebook||'',iconUrl:'',fit:'contain'},{label:'Instagram',url:s.instagram||'',iconUrl:'',fit:'contain'},{label:'YouTube',url:s.youtube||'',iconUrl:'',fit:'contain'},{label:'LinkedIn',url:s.linkedin||'',iconUrl:'',fit:'contain'}];
      const socials=(Array.isArray(s.socialLinks)&&s.socialLinks.length?s.socialLinks:fallbackSocials).filter(x=>x&&(x.label||x.url||x.iconUrl));
      if(socials.length) document.querySelectorAll('.social-row').forEach(row=>{
        row.innerHTML='';socials.forEach(x=>{
          const box=document.createElement(x.url?'a':'span');box.className='social-link-box'+(x.url?'':' is-disabled');if(x.url){box.href=String(x.url);box.target='_blank';box.rel='noopener'}box.setAttribute('aria-label',String(x.label||'Social link'));box.dataset.fit=x.fit==='cover'?'cover':'contain';box.title=String(x.label||'Social link');
          if(x.iconUrl){const img=document.createElement('img');img.className='social-link-image';img.src=String(x.iconUrl);img.alt='';box.appendChild(img)}else{const span=document.createElement('span');const label=String(x.label||'Social').trim(),parts=label.split(/\s+/);span.className='social-link-fallback';span.textContent=(parts.length>1?parts.slice(0,2).map(w=>w[0]).join(''):label.slice(0,2)).toUpperCase();box.appendChild(span)}
          row.appendChild(box);
        });
      });
      if(s.announcementEnabled&&s.announcementText&&!document.querySelector('.logic-announcement')){const bar=document.createElement('div');bar.className='logic-announcement';const content=s.announcementLink?`<a href="${s.announcementLink}">${s.announcementText} <b>→</b></a>`:s.announcementText;bar.innerHTML=content;document.body.prepend(bar);}
      if(s.customHeadCode&&!document.querySelector('[data-global-head-code]')){const marker=document.createElement('meta');marker.setAttribute('data-global-head-code','1');document.head.appendChild(marker);const t=document.createElement('template');t.innerHTML=s.customHeadCode;[...t.content.childNodes].forEach(n=>{if(n.nodeName==='SCRIPT'){const sc=document.createElement('script');[...n.attributes].forEach(a=>sc.setAttribute(a.name,a.value));sc.text=n.textContent;document.head.appendChild(sc)}else document.head.appendChild(n.cloneNode(true));});}
      applyTypographySettings(s.typography);
      applyAnimationSettings(s.animations);
    }catch(e){}
  }
  async function applyCmsEditorTypography(){
    try{
      const res=await fetch(root+'api/public/settings',{cache:'no-store'});if(!res.ok)return;
      const payload=await res.json(),s=payload.settings||{};
      applyTypographySettings(s.typography);
      if(s.primaryColor){document.documentElement.style.setProperty('--green',s.primaryColor);document.documentElement.style.setProperty('--green2',s.primaryColor)}
      if(s.secondaryColor)document.documentElement.style.setProperty('--yellow',s.secondaryColor);
    }catch(e){}
  }
  const cmsEditMode=new URLSearchParams(location.search).has('cms_edit');
  if(!cmsEditMode){applyPublicSettings();applyPublicBrochureSettings();} else applyCmsEditorTypography();
  if(cmsEditMode) ensureResourceNavigation(); else setTimeout(ensureResourceNavigation,250);

  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const siteHeader=document.querySelector('.site-header');const updateHeader=()=>siteHeader?.classList.toggle('scrolled',scrollY>18);updateHeader();addEventListener('scroll',updateHeader,{passive:true});
  const toggle=document.querySelector('.menu-toggle'), mobile=document.querySelector('.mobile-nav');
  if(toggle&&mobile) toggle.addEventListener('click',()=>{const open=mobile.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});

  document.querySelectorAll('[data-course-filters]').forEach(group=>{
    const scope=group.closest('.container')||document;
    group.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
      group.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
      const f=btn.dataset.filter;
      scope.querySelectorAll('[data-category]').forEach(card=>{const c=(card.dataset.category||'').toLowerCase();card.classList.toggle('hidden',f!=='all'&&!c.includes(f));});
    }));
  });
  const search=document.querySelector('.course-search');
  if(search) search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();document.querySelectorAll('.course-full-card').forEach(c=>c.classList.toggle('hidden',q&&!c.textContent.toLowerCase().includes(q)));});

  const params=new URLSearchParams(location.search);
  if(params.get('course')) document.querySelectorAll('select[name="course"]').forEach(s=>{[...s.options].forEach(o=>{if(o.value.toLowerCase()===params.get('course').toLowerCase()||o.text.toLowerCase().includes(params.get('course').toLowerCase()))s.value=o.value;});});
  if(params.get('branch')) document.querySelectorAll('select[name="branch"]').forEach(s=>{[...s.options].forEach(o=>{if(o.value.toLowerCase().includes(params.get('branch').toLowerCase()))s.value=o.value;});});

  const batchMode=document.getElementById('batchMode'),batchBranch=document.getElementById('batchBranch');
  const filterBatches=()=>{if(!batchMode||!batchBranch)return;document.querySelectorAll('#batchRows tr').forEach(r=>{const okM=batchMode.value==='all'||r.dataset.mode===batchMode.value;const okB=batchBranch.value==='all'||r.dataset.branch===batchBranch.value;r.hidden=!(okM&&okB);});};
  batchMode?.addEventListener('change',filterBatches);batchBranch?.addEventListener('change',filterBatches);



  // v6.4: seamless homepage placement-partner marquee
  function initHomePartnerMarquee(){
    if(cmsEditMode)return;
    document.querySelectorAll('.home-partner-logo-grid').forEach(row=>{
      if(row.dataset.marqueeReady==='1')return;
      const cards=[...row.children].filter(el=>el.classList.contains('home-partner-logo-card'));
      if(cards.length<2)return;
      const track=document.createElement('div');track.className='home-partner-marquee-track';
      const group=document.createElement('div');group.className='home-partner-marquee-group';
      cards.forEach(card=>group.appendChild(card));
      const clone=group.cloneNode(true);clone.setAttribute('aria-hidden','true');
      clone.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
      track.append(group,clone);row.appendChild(track);
      row.classList.add('is-marquee-ready');row.dataset.marqueeReady='1';
      row.style.setProperty('--partner-marquee-duration',Math.max(22,cards.length*4.5)+'s');
    });
  }
  initHomePartnerMarquee();

  // v6: YouTube testimonial modal
  const youtubeId=url=>{try{const u=new URL(url,location.href);if(u.hostname.includes('youtu.be'))return u.pathname.split('/').filter(Boolean)[0]||'';if(u.hostname.includes('youtube.com')){if(u.searchParams.get('v'))return u.searchParams.get('v');const parts=u.pathname.split('/').filter(Boolean);const idx=parts.findIndex(x=>['embed','shorts','live'].includes(x));if(idx>=0&&parts[idx+1])return parts[idx+1]}return ''}catch(e){return ''}};
  function ensureVideoModal(){let m=document.querySelector('.video-modal');if(m)return m;m=document.createElement('div');m.className='video-modal';m.innerHTML='<div class="video-modal-shell"><button class="video-modal-close" type="button" aria-label="Close video">×</button><iframe title="YouTube video testimonial" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';document.body.appendChild(m);const close=()=>{m.classList.remove('open');m.querySelector('iframe').src='';document.body.style.overflow=''};m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.video-modal-close'))close()});addEventListener('keydown',e=>{if(e.key==='Escape'&&m.classList.contains('open'))close()});return m}
  document.addEventListener('click',e=>{const link=e.target.closest('[data-youtube-modal]');if(!link)return;const id=youtubeId(link.href);if(!id)return;e.preventDefault();logicTrack('testimonial_video_open',{video_id:id,page:location.pathname});const m=ensureVideoModal();m.querySelector('iframe').src='https://www.youtube.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0';m.classList.add('open');document.body.style.overflow='hidden'});

  // v6: result-poster lightbox
  function ensureImageLightbox(){let m=document.querySelector('.image-lightbox');if(m)return m;m=document.createElement('div');m.className='image-lightbox';m.innerHTML='<button class="image-lightbox-close" type="button" aria-label="Close image">×</button><img alt="Expanded result poster">';document.body.appendChild(m);const close=()=>{m.classList.remove('open');m.querySelector('img').src='';document.body.style.overflow=''};m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.image-lightbox-close'))close()});addEventListener('keydown',e=>{if(e.key==='Escape'&&m.classList.contains('open'))close()});return m}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-image-lightbox]');if(!b)return;e.preventDefault();const card=b.closest('.result-poster-card');const current=card?.querySelector('.result-poster-media img')?.getAttribute('src');const src=current||b.getAttribute('data-image-lightbox');if(!src)return;const m=ensureImageLightbox();m.querySelector('img').src=src;m.classList.add('open');document.body.style.overflow='hidden'});

  // v6: career pathway assessment
  document.querySelectorAll('form[data-career-test]').forEach(form=>{
    const steps=[...form.querySelectorAll('[data-career-step]')],next=form.querySelector('[data-career-next]'),prev=form.querySelector('[data-career-prev]'),submit=form.querySelector('[data-career-submit]'),err=form.querySelector('[data-career-error]'),num=form.querySelector('[data-career-step-number]'),progress=form.querySelector('[data-career-progress]'),result=document.querySelector('[data-career-result]');let index=0;
    const show=i=>{index=Math.max(0,Math.min(steps.length-1,i));steps.forEach((s,n)=>s.classList.toggle('is-active',n===index));num.textContent=String(index+1);progress.style.width=((index+1)/steps.length*100)+'%';prev.disabled=index===0;next.hidden=index===steps.length-1;submit.hidden=index!==steps.length-1;err.textContent='';form.scrollIntoView({behavior:'smooth',block:'center'})};
    const valid=()=>{const step=steps[index],q=step.dataset.question;if(q&&!form.querySelector('input[name="'+q+'"]:checked')){err.textContent='Choose one option to continue.';return false}if(index===steps.length-1){const name=form.elements.name?.value.trim(),phone=form.elements.phone?.value.trim(),consent=form.elements.consent?.checked;if(!name||!phone){err.textContent='Enter your name and WhatsApp number.';return false}if(!consent){err.textContent='Please confirm contact consent to continue.';return false}}return true};
    next?.addEventListener('click',()=>{if(valid())show(index+1)});prev?.addEventListener('click',()=>show(index-1));
    form.querySelector('[data-career-reset]')?.addEventListener('click',()=>{form.reset();show(0);result.hidden=true;form.hidden=false});
    const restart=()=>{form.reset();form.hidden=false;result.hidden=true;show(0)};document.querySelector('[data-career-restart]')?.addEventListener('click',restart);
    form.addEventListener('submit',async e=>{e.preventDefault();if(!valid())return;const fd=new FormData(form);let india=0,global=0;['examStyle','recognition','careerMarket','earning','budget','motivation'].forEach(k=>{const v=fd.get(k);if(v==='india')india++;if(v==='global')global++});const direction=global>india?'global':india>global?'india':'balanced';const title=direction==='global'?'International Professional Course Pathway':direction==='india'?'India-Focused Professional Course Pathway':'Balanced Professional Course Pathway';const copy=direction==='global'?'Your answers lean toward international recognition, modular study flexibility and global or multinational career environments.':direction==='india'?'Your answers lean toward India-focused professional recognition, structured progression and local career or practice opportunities.':'Your preferences are evenly split between India-focused and international pathways. A side-by-side course comparison will be more useful than forcing one direction.';const courses=direction==='global'?['ACCA','CMA USA','EA / CIAP to explore']:direction==='india'?['CA','CMA India','Skill programmes to complement your path']:['CA / CMA India','ACCA / CMA USA','Compare with a counsellor'];result.querySelector('[data-career-result-title]').textContent=title;result.querySelector('[data-career-result-copy]').textContent=copy;result.querySelector('[data-career-result-courses]').innerHTML=courses.map(x=>'<span>'+x+'</span>').join('');form.hidden=true;result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'center'});const payload=Object.fromEntries(fd.entries());payload.formType='Career Test';payload.recommendation=title;payload.indiaScore=india;payload.globalScore=global;payload.page=location.pathname;payload.submittedAt=new Date().toISOString();logicTrack('career_test_complete',{recommendation:title,pathway:direction,page:location.pathname,source:'Website Career Test'});try{if(location.protocol.startsWith('http')){const r=await fetch(root+'api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(r.ok)logicTrack('lead_submit',{form_type:'career_test',recommendation:title,page:location.pathname,source:'Website Career Test'})}}catch(e){} });
    show(0);
  });

  async function submitForm(form){
    const status=form.querySelector('.form-status'); if(status){status.textContent='Submitting…';status.style.color='inherit';}
    const data=Object.fromEntries(new FormData(form).entries()); data.page=location.pathname; data.submittedAt=new Date().toISOString();
    const kind=form.dataset.form||'enquiry';
    const configured=(window.LOGIC_CONFIG&&window.LOGIC_CONFIG.formEndpoint)||'';
    const endpoint=configured || (location.protocol.startsWith('http') ? root+'api/'+kind : '');
    try{
      if(endpoint){const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!res.ok)throw new Error('Request failed');}
      else{const key='logic_'+kind+'_submissions';const saved=JSON.parse(localStorage.getItem(key)||'[]');saved.push(data);localStorage.setItem(key,JSON.stringify(saved));}
      const eventData={form_type:kind,course:data.course||'',branch:data.branch||'',page:location.pathname,source:data.source||''};
      if(kind==='newsletter'){logicTrack('newsletter_subscribe',{page:location.pathname,source:'Website Newsletter'});if(status)status.textContent='Subscribed. Thank you!';form.reset();return;}
      logicTrack('lead_submit',eventData);
      if(location.pathname.includes('placement-assistance'))logicTrack('placement_assistance_submit',{...eventData,source:'Website Placement Assistance'});
      else if(kind==='contact')logicTrack('contact_submit',eventData);
      else if(kind==='enquiry')logicTrack('course_enquiry',eventData);
      setTimeout(()=>{location.href=root+'thank-you.html'},120);
    }catch(err){if(status){status.textContent='Could not submit right now. Please call or WhatsApp admissions.';status.style.color='#b42318';}}
  }
  document.addEventListener('click',e=>{
    if(trackingConfig.trackContactClicks===false)return;
    const a=e.target.closest('a[href]');if(!a)return;const href=String(a.getAttribute('href')||'');
    if(/(?:wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/)/i.test(href))logicTrack('whatsapp_click',{page:location.pathname,link_location:a.closest('header')?'header':a.closest('footer')?'footer':'content'});
    else if(/^tel:/i.test(href))logicTrack('call_click',{page:location.pathname,link_location:a.closest('header')?'header':a.closest('footer')?'footer':'content'});
  },{passive:true});
  document.querySelectorAll('form[data-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();submitForm(f)}));
})();
