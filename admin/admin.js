(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const state={pages:[],media:[],settings:{},selectedEl:null,selectedPlainText:'',selectedHtml:'',selectedComputed:{},heroInitial:{},currentPage:'',pageHtml:'',pageDirty:false,mediaPurpose:null};
  const animationDefaults={enabled:true,respectReducedMotion:true,once:true,preset:'fade-up',duration:480,delay:0,distance:14,stagger:45,threshold:.05,easing:'cubic-bezier(0.22, 1, 0.36, 1)',autoSections:false,autoCards:true,autoText:false,autoImages:false,autoButtons:false,customSelectors:'',smoothScroll:true,cardHover:true,imageHover:true,buttonHover:true,premiumSpotlight:true,magneticButtons:true,countUp:true,scrollProgress:true,heroParallax:true};
  const typographyDefaults={enabled:false,h1Size:80,h1MobileSize:52,h1Weight:800,h2Size:56,h2MobileSize:38,h2Weight:800,h3Size:20,h3MobileSize:18,h3Weight:700,bodySize:14,bodyMobileSize:14,bodyWeight:400,navSize:12,navWeight:700,buttonSize:13,buttonWeight:800,labelSize:10,labelWeight:800};
  const socialDefaults=[{label:'Facebook',url:'',iconUrl:'',fit:'contain'},{label:'Instagram',url:'',iconUrl:'',fit:'contain'},{label:'YouTube',url:'',iconUrl:'',fit:'contain'},{label:'LinkedIn',url:'',iconUrl:'',fit:'contain'}];
  const trackingDefaults={enabled:false,gtmEnabled:false,gtmId:'',ga4Enabled:false,ga4Id:'',metaEnabled:false,metaPixelId:'',trackConversions:true,trackContactClicks:true};
  const sectionMeta={dashboard:['OVERVIEW','Dashboard'],branding:['GLOBAL SETTINGS','Branding & Global'],pages:['VISUAL EDITOR','Page Editor'],typography:['TYPE SYSTEM','Typography'],animations:['MOTION CONTROL','Animations'],media:['ASSET MANAGER','Media Library'],brochures:['PDF MANAGER','Brochures'],leads:['FORM SUBMISSIONS','Leads & Forms'],integrations:['LEAD ROUTING','CRM / Odoo'],tracking:['MEASUREMENT','Tracking & Analytics'],developer:['ADVANCED CONTROL','Developer'],security:['ADMIN ACCESS','Security']};
  const brochureCourses=[['ca','CA'],['cma-india','CMA India'],['ciap','CIAP'],['acca','ACCA'],['cma-usa','CMA USA'],['cpa-usa','CPA USA'],['ea','EA'],['bcom-acca','B.Com + ACCA'],['mba-acca','MBA + ACCA'],['mcom-cpa','M.Com + CPA'],['bat','BAT Pro'],['dipifr','DipIFR']];
  let toastTimer;

  function toast(msg,error=false){const t=$('#toast');t.textContent=msg;t.className='toast show'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.className='toast',2600)}
  async function api(path,opts={}){
    const init={credentials:'same-origin',...opts};
    if(init.body && typeof init.body!=='string'){init.headers={...(init.headers||{}),'Content-Type':'application/json'};init.body=JSON.stringify(init.body)}
    init.headers={...(init.headers||{}),'X-CSRF-Token':window.logicCsrf||''};
    const r=await fetch(path,init);let data={};try{data=await r.json()}catch{}
    if(data.csrfToken)window.logicCsrf=data.csrfToken;
    if(r.status===401 && path!=='/api/admin/login'){showLogin();throw new Error('Session expired')}
    if(!r.ok)throw new Error(data.error||`Request failed (${r.status})`);return data;
  }
  function showLogin(){ $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden'); }
  function showApp(){ $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); }
  function formatBytes(n){if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1)+' KB';return (n/1048576).toFixed(1)+' MB'}
  function formatDate(d){try{return new Date(d).toLocaleString()}catch{return d||''}}
  function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  async function boot(){
    wire();
    try{const s=await api('/api/admin/session');if(!s.authenticated)return showLogin();showApp();wire();await Promise.all([loadDashboard(),loadPages(),loadMedia(),loadSettings(),loadTypography(),loadAnimations()]);}
    catch(e){showLogin()}
  }
  let wired=false;
  function wire(){if(wired)return;wired=true;
    $('#loginForm').addEventListener('submit',login);
    $('#logoutBtn').addEventListener('click',logout);
    $('#mobileMenu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
    $$('#adminNav button[data-section]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.section)));
    $$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
    $('#saveSettings').addEventListener('click',saveSettings);
    $('#saveTypography').addEventListener('click',saveTypography);
    $('#resetTypography').addEventListener('click',resetTypography);
    $('#typoEnabled').addEventListener('change',updateTypographyPreview);
    [['#typoH1Size','#typoH1SizeNumber'],['#typoH2Size','#typoH2SizeNumber'],['#typoH3Size','#typoH3SizeNumber'],['#typoBodySize','#typoBodySizeNumber'],['#typoNavSize','#typoNavSizeNumber'],['#typoButtonSize','#typoButtonSizeNumber'],['#typoLabelSize','#typoLabelSizeNumber']].forEach(([range,num])=>wireTypographyPair(range,num));
    ['#typoH1MobileSize','#typoH1Weight','#typoH2MobileSize','#typoH2Weight','#typoH3MobileSize','#typoH3Weight','#typoBodyMobileSize','#typoBodyWeight','#typoNavWeight','#typoButtonWeight','#typoLabelWeight'].forEach(sel=>$(sel).addEventListener('input',()=>{activateCustomTypography();updateTypographyPreview()}));
    $('#saveAnimations').addEventListener('click',saveAnimations);
    $('#resetAnimations').addEventListener('click',resetAnimations);
    $('#replayAnimation').addEventListener('click',playAnimationPreview);
    ['#animPreset','#animDuration','#animDelay','#animDistance','#animStagger','#animEasing'].forEach(sel=>$(sel).addEventListener('input',playAnimationPreview));
    $('#chooseLogo').addEventListener('click',()=>openMediaModal('logo'));
    $('#addSocialLink').addEventListener('click',()=>{const items=readSocialLinksEditor();items.push({label:'New social',url:'',iconUrl:'',fit:'contain'});renderSocialLinksEditor(items)});
    $('#pageSelect').addEventListener('change',()=>loadPage($('#pageSelect').value));
    $('#newPage').addEventListener('click',createNewPage);
    $('#duplicatePage').addEventListener('click',duplicatePage);
    $('#deletePage').addEventListener('click',deletePage);
    $('#reloadPage').addEventListener('click',()=>loadPage(state.currentPage));
    $('#savePage').addEventListener('click',saveCurrentPage);
    $('#visualMode').addEventListener('click',showVisualMode);
    $('#sourceMode').addEventListener('click',showSourceMode);
    $('#pageSource').addEventListener('input',()=>markPageDirty());
    $('#pageFrame').addEventListener('load',setupFrameEditor);
    $('#selectParentElement').addEventListener('click',()=>{if(state.selectedEl?.parentElement)selectElement(state.selectedEl.closest('[data-record-id]')||state.selectedEl.parentElement);});
    $('#applySeo').addEventListener('click',applyPageSeo);
    $('#applyHeroQuick').addEventListener('click',applyHeroQuickEditor);
    $('#applyElement').addEventListener('click',applyElementChanges);
    $('#duplicateElement').addEventListener('click',duplicateSelectedElement);
    $('#moveElementUp').addEventListener('click',()=>moveSelectedElement(-1));
    $('#moveElementDown').addEventListener('click',()=>moveSelectedElement(1));
    $('#deleteElement').addEventListener('click',deleteSelectedElement);
    $('#chooseElementImage').addEventListener('click',()=>openMediaModal('element'));
    $$('.insert-grid button').forEach(b=>b.addEventListener('click',()=>insertElement(b.dataset.insert)));
    $('#uploadMediaBtn').addEventListener('click',()=>$('#mediaUpload').click());
    $('#mediaUpload').addEventListener('change',e=>uploadFiles([...e.target.files]));
    $('#mediaSearch').addEventListener('input',renderMedia);
    $('#closeMediaModal').addEventListener('click',closeMediaModal);
    $('#mediaModal').addEventListener('click',e=>{if(e.target.id==='mediaModal')closeMediaModal()});
    $('#modalUploadBtn').addEventListener('click',()=>$('#modalUpload').click());
    $('#modalUpload').addEventListener('change',e=>uploadFiles([...e.target.files],true));
    $('#saveBrochures').addEventListener('click',saveBrochures);
    $('#uploadMasterBrochure').addEventListener('click',()=>$('#masterBrochureFile').click());
    $('#masterBrochureFile').addEventListener('change',e=>uploadBrochureFile(e.target.files[0],'master'));
    $('#courseBrochureGrid').addEventListener('click',e=>{const b=e.target.closest('[data-upload-brochure]');if(b){const input=document.querySelector(`[data-brochure-file="${b.dataset.uploadBrochure}"]`);input?.click()}});
    $('#courseBrochureGrid').addEventListener('change',e=>{if(e.target.matches('[data-brochure-file]'))uploadBrochureFile(e.target.files[0],e.target.dataset.brochureFile)});
    $('#saveIntegration').addEventListener('click',saveIntegration);
    $('#testIntegration').addEventListener('click',testIntegration);
    $('#refreshIntegrationLog').addEventListener('click',loadIntegration);
    $('#crmMode').addEventListener('change',toggleIntegrationMode);
    $('#saveTracking').addEventListener('click',saveTracking);
    $('#clearLeads').addEventListener('click',clearLeads);
    $('#devFileSelect').addEventListener('change',loadDevFile);
    $('#saveDevFile').addEventListener('click',saveDevFile);
    $('#refreshBackups').addEventListener('click',loadBackups);
    $('#passwordForm').addEventListener('submit',changePassword);
    window.addEventListener('beforeunload',e=>{if(state.pageDirty){e.preventDefault();e.returnValue='';}});
  }
  function go(name){
    $$('.admin-section').forEach(s=>s.classList.toggle('active',s.id==='section-'+name));
    $$('#adminNav button').forEach(b=>b.classList.toggle('active',b.dataset.section===name));
    const meta=sectionMeta[name]||['',''];$('#sectionKicker').textContent=meta[0];$('#sectionTitle').textContent=meta[1];$('.sidebar').classList.remove('open');
    if(name==='dashboard')loadDashboard(); if(name==='typography')loadTypography(); if(name==='animations')loadAnimations(); if(name==='media')loadMedia(); if(name==='brochures')loadBrochures(); if(name==='leads')loadLeads(); if(name==='integrations')loadIntegration(); if(name==='tracking')loadTracking(); if(name==='developer'){loadDevFile();loadBackups()}
  }
  async function login(e){e.preventDefault();const fd=new FormData(e.currentTarget);$('#loginError').textContent='';try{await api('/api/admin/login',{method:'POST',body:Object.fromEntries(fd)});showApp();wire();await Promise.all([loadDashboard(),loadPages(),loadMedia(),loadSettings(),loadTypography(),loadAnimations()]);toast('Signed in')}catch(err){$('#loginError').textContent=err.message}}
  async function logout(){try{await api('/api/admin/logout',{method:'POST'})}catch{}showLogin()}

  async function loadDashboard(){
    try{const d=await api('/api/admin/dashboard');const s=d.stats;$('#dashboardStats').innerHTML=[['Pages',s.pages,'Editable website pages'],['Media',s.media,'Images & graphics'],['Leads',s.leads,'Form submissions'],['Backups',s.backups,'Saved restore points']].map(x=>`<div class="stat-box"><b>${x[1]}</b><span>${x[0]} · ${x[2]}</span></div>`).join('');
      $('#recentLeads').innerHTML=d.recentLeads.length?d.recentLeads.map(l=>`<div class="simple-item"><div><b>${escapeHtml(l.name||l.email||'Website lead')}</b><span>${escapeHtml(l.kind||'enquiry')}</span></div><span>${escapeHtml(l.phone||l.course||'')}</span><span>${formatDate(l.receivedAt)}</span></div>`).join(''):'<div class="empty-state">No form submissions yet.</div>';
    }catch(e){toast(e.message,true)}
  }

  const settingsFields={siteName:'#setSiteName',tagline:'#setTagline',logoUrl:'#setLogoUrl',faviconUrl:'#setFaviconUrl',primaryColor:'#setPrimary',secondaryColor:'#setSecondary',phone:'#setPhone',whatsapp:'#setWhatsapp',email:'#setEmail',address:'#setAddress',announcementText:'#setAnnouncementText',announcementLink:'#setAnnouncementLink',customHeadCode:'#setCustomHead'};
  function linksToText(items){return Array.isArray(items)?items.map(x=>`${x.label||''} | ${x.url||''}`).join('\n'):''}
  function textToLinks(text){return String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const i=line.indexOf('|');return i<0?{label:line,url:'#'}:{label:line.slice(0,i).trim(),url:line.slice(i+1).trim()}}).filter(x=>x.label&&x.url)}
  function normalizedSocialLinks(settings={}){
    if(Array.isArray(settings.socialLinks)&&settings.socialLinks.length)return settings.socialLinks.map(x=>({label:String(x.label||'Social'),url:String(x.url||''),iconUrl:String(x.iconUrl||''),fit:x.fit==='cover'?'cover':'contain'}));
    return socialDefaults.map(x=>{const key=x.label.toLowerCase().replace(/\s+/g,'');return {...x,url:String(settings[key]||'')}});
  }
  function socialInitial(label){const t=String(label||'Social').trim();if(!t)return '↗';const words=t.split(/\s+/);return (words.length>1?words.slice(0,2).map(w=>w[0]).join(''):t.slice(0,2)).toUpperCase()}
  function renderSocialLinksEditor(items){
    const host=$('#socialLinksEditor');if(!host)return;const list=Array.isArray(items)?items:[];
    host.innerHTML=list.map((x,i)=>`<article class="social-edit-row" data-social-index="${i}"><div class="social-edit-preview ${x.fit==='cover'?'is-cover':'is-contain'}">${x.iconUrl?`<img src="${escapeHtml(x.iconUrl)}" alt="">`:`<span>${escapeHtml(socialInitial(x.label))}</span>`}</div><div class="social-edit-fields"><div class="form-grid"><label>Platform / label<input class="social-label" value="${escapeHtml(x.label||'')}" placeholder="Instagram"></label><label>Profile URL<input class="social-url" value="${escapeHtml(x.url||'')}" placeholder="https://instagram.com/..."></label><label class="full">Icon / image URL<input class="social-icon-url" value="${escapeHtml(x.iconUrl||'')}" placeholder="/uploads/instagram.svg"><button class="secondary mini choose-social-icon" type="button" data-index="${i}">Choose / Upload Image</button></label><label>Image fit<select class="social-fit"><option value="contain"${x.fit!=='cover'?' selected':''}>Contain — icon / logo</option><option value="cover"${x.fit==='cover'?' selected':''}>Cover & clip — full image</option></select></label><label>Website box size<input value="38 × 38 px" disabled></label></div></div><button class="social-remove danger" type="button" title="Remove social icon">×</button></article>`).join('');
    host.querySelectorAll('.choose-social-icon').forEach(b=>b.addEventListener('click',()=>openMediaModal('social:'+b.dataset.index)));
    host.querySelectorAll('.social-remove').forEach(b=>b.addEventListener('click',()=>{const idx=Number(b.closest('.social-edit-row').dataset.socialIndex),next=readSocialLinksEditor();next.splice(idx,1);renderSocialLinksEditor(next)}));
    host.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>refreshSocialEditorPreviews()));
  }
  function refreshSocialEditorPreviews(){
    $$('#socialLinksEditor .social-edit-row').forEach(row=>{const label=row.querySelector('.social-label')?.value||'Social',url=row.querySelector('.social-icon-url')?.value.trim()||'',fit=row.querySelector('.social-fit')?.value==='cover'?'cover':'contain',preview=row.querySelector('.social-edit-preview');preview.classList.toggle('is-cover',fit==='cover');preview.classList.toggle('is-contain',fit!=='cover');preview.innerHTML=url?`<img src="${escapeHtml(url)}" alt="">`:`<span>${escapeHtml(socialInitial(label))}</span>`;});
  }
  function readSocialLinksEditor(){return $$('#socialLinksEditor .social-edit-row').map(row=>({label:row.querySelector('.social-label')?.value.trim()||'Social',url:row.querySelector('.social-url')?.value.trim()||'',iconUrl:row.querySelector('.social-icon-url')?.value.trim()||'',fit:row.querySelector('.social-fit')?.value==='cover'?'cover':'contain'})).filter(x=>x.label||x.url||x.iconUrl)}
  async function loadSettings(){try{const d=await api('/api/admin/settings');state.settings=d.settings||{};for(const [k,sel] of Object.entries(settingsFields)){$(sel).value=state.settings[k]??''}$('#setNavigation').value=linksToText(state.settings.navigation);$('#setFooterCourses').value=linksToText(state.settings.footerCourses);$('#setAnnouncementEnabled').checked=!!state.settings.announcementEnabled;renderLogoPreview();renderSocialLinksEditor(normalizedSocialLinks(state.settings))}catch(e){toast(e.message,true)}}
  function renderLogoPreview(){const u=$('#setLogoUrl').value.trim();$('#logoPreview').innerHTML=u?`<img src="${escapeHtml(u)}" alt="Logo preview">`:'No logo uploaded'}
  async function saveSettings(){const body={};for(const [k,sel] of Object.entries(settingsFields))body[k]=$(sel).value.trim();body.announcementEnabled=$('#setAnnouncementEnabled').checked;body.navigation=textToLinks($('#setNavigation').value);body.footerCourses=textToLinks($('#setFooterCourses').value);body.socialLinks=readSocialLinksEditor();const legacy={facebook:'',instagram:'',youtube:'',linkedin:''};body.socialLinks.forEach(x=>{const k=x.label.toLowerCase().replace(/[^a-z]/g,'');if(k in legacy&&!legacy[k])legacy[k]=x.url});Object.assign(body,legacy);try{const d=await api('/api/admin/settings',{method:'PUT',body});state.settings=d.settings;renderLogoPreview();renderSocialLinksEditor(normalizedSocialLinks(state.settings));toast('Global settings saved')}catch(e){toast(e.message,true)}}

  function clampValue(n,min,max,fallback){return Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):fallback}
  function activateCustomTypography(){
    const enabled=$('#typoEnabled');
    if(enabled&&!enabled.checked){enabled.checked=true;toast('Custom typography enabled — click Save & Apply to publish');}
  }
  function wireTypographyPair(rangeSel,numberSel){
    const range=$(rangeSel),num=$(numberSel);if(!range||!num)return;
    range.addEventListener('input',()=>{activateCustomTypography();num.value=range.value;updateTypographyPreview()});
    num.addEventListener('input',()=>{activateCustomTypography();const v=clampValue(num.value,Number(range.min),Number(range.max),Number(range.value));range.value=v;num.value=v;updateTypographyPreview()});
  }
  function setTypographyPair(prefix,value){const r=$('#typo'+prefix+'Size'),n=$('#typo'+prefix+'SizeNumber');if(r)r.value=value;if(n)n.value=value}
  function setTypographyForm(typography){
    const x={...typographyDefaults,...(typography||{})};
    $('#typoEnabled').checked=!!x.enabled;
    setTypographyPair('H1',x.h1Size);$('#typoH1MobileSize').value=x.h1MobileSize;$('#typoH1Weight').value=String(x.h1Weight);
    setTypographyPair('H2',x.h2Size);$('#typoH2MobileSize').value=x.h2MobileSize;$('#typoH2Weight').value=String(x.h2Weight);
    setTypographyPair('H3',x.h3Size);$('#typoH3MobileSize').value=x.h3MobileSize;$('#typoH3Weight').value=String(x.h3Weight);
    setTypographyPair('Body',x.bodySize);$('#typoBodyMobileSize').value=x.bodyMobileSize;$('#typoBodyWeight').value=String(x.bodyWeight);
    setTypographyPair('Nav',x.navSize);$('#typoNavWeight').value=String(x.navWeight);
    setTypographyPair('Button',x.buttonSize);$('#typoButtonWeight').value=String(x.buttonWeight);
    setTypographyPair('Label',x.labelSize);$('#typoLabelWeight').value=String(x.labelWeight);
    updateTypographyPreview();
  }
  function readTypographyForm(){
    return {
      enabled:$('#typoEnabled').checked,
      h1Size:clampValue($('#typoH1SizeNumber').value,32,120,80),h1MobileSize:clampValue($('#typoH1MobileSize').value,28,90,52),h1Weight:clampValue($('#typoH1Weight').value,300,900,800),
      h2Size:clampValue($('#typoH2SizeNumber').value,24,90,56),h2MobileSize:clampValue($('#typoH2MobileSize').value,22,70,38),h2Weight:clampValue($('#typoH2Weight').value,300,900,800),
      h3Size:clampValue($('#typoH3SizeNumber').value,14,48,20),h3MobileSize:clampValue($('#typoH3MobileSize').value,14,40,18),h3Weight:clampValue($('#typoH3Weight').value,300,900,700),
      bodySize:clampValue($('#typoBodySizeNumber').value,10,24,14),bodyMobileSize:clampValue($('#typoBodyMobileSize').value,10,22,14),bodyWeight:clampValue($('#typoBodyWeight').value,300,900,400),
      navSize:clampValue($('#typoNavSizeNumber').value,9,22,12),navWeight:clampValue($('#typoNavWeight').value,300,900,700),
      buttonSize:clampValue($('#typoButtonSizeNumber').value,9,24,13),buttonWeight:clampValue($('#typoButtonWeight').value,300,900,800),
      labelSize:clampValue($('#typoLabelSizeNumber').value,7,18,10),labelWeight:clampValue($('#typoLabelWeight').value,300,900,800)
    };
  }
  async function loadTypography(){try{const d=await api('/api/admin/settings');state.settings=d.settings||state.settings||{};setTypographyForm(state.settings.typography)}catch(e){toast(e.message,true)}}
  async function saveTypography(){try{const typography=readTypographyForm();const d=await api('/api/admin/settings',{method:'PUT',body:{typography}});state.settings=d.settings;setTypographyForm(typography);toast(typography.enabled?'Typography saved & applied to the live website':'Custom typography disabled — original design typography restored')}catch(e){toast(e.message,true)}}
  function resetTypography(){if(!confirm('Reset typography controls to the recommended defaults? Save afterwards to publish them.'))return;setTypographyForm(typographyDefaults);toast('Typography defaults loaded — click Save Typography to publish')}
  function updateTypographyPreview(){
    const x=readTypographyForm(),host=$('#typographyPreview');if(!host)return;
    const h1=host.querySelector('h1'),h2=host.querySelector('h2'),h3=host.querySelector('h3'),p=host.querySelector('p'),nav=host.querySelector('.type-preview-nav'),btn=host.querySelector('button'),label=host.querySelector('.type-preview-label');
    h1.style.fontSize=x.h1Size+'px';h1.style.fontWeight=x.h1Weight;h2.style.fontSize=x.h2Size+'px';h2.style.fontWeight=x.h2Weight;h3.style.fontSize=x.h3Size+'px';h3.style.fontWeight=x.h3Weight;p.style.fontSize=x.bodySize+'px';p.style.fontWeight=x.bodyWeight;nav.style.fontSize=x.navSize+'px';nav.style.fontWeight=x.navWeight;btn.style.fontSize=x.buttonSize+'px';btn.style.fontWeight=x.buttonWeight;label.style.fontSize=x.labelSize+'px';label.style.fontWeight=x.labelWeight;
    $('#typoH1Readout').textContent=x.h1Size+' px';$('#typoH2Readout').textContent=x.h2Size+' px';$('#typoH3Readout').textContent=x.h3Size+' px';$('#typoBodyReadout').textContent=x.bodySize+' px';$('#typoNavReadout').textContent=x.navSize+' px';$('#typoButtonReadout').textContent=x.buttonSize+' px';$('#typoLabelReadout').textContent=x.labelSize+' px';
    const badge=$('#typographyModeBadge');badge.textContent=x.enabled?'Custom typography on':'Custom typography off';badge.classList.toggle('on',x.enabled);
  }

  function animationValue(id,type='string'){
    const el=$(id);if(type==='bool')return !!el.checked;if(type==='number')return Number(el.value);return el.value;
  }
  function setAnimationForm(a){
    const x={...animationDefaults,...(a||{})};
    $('#animEnabled').checked=!!x.enabled;$('#animRespectReduced').checked=!!x.respectReducedMotion;$('#animOnce').checked=!!x.once;$('#animPreset').value=x.preset||'fade-up';$('#animDuration').value=x.duration;$('#animDelay').value=x.delay;$('#animDistance').value=x.distance;$('#animStagger').value=x.stagger;$('#animThreshold').value=x.threshold;$('#animEasing').value=x.easing;$('#animAutoSections').checked=!!x.autoSections;$('#animAutoCards').checked=!!x.autoCards;$('#animAutoText').checked=!!x.autoText;$('#animAutoImages').checked=!!x.autoImages;$('#animAutoButtons').checked=!!x.autoButtons;$('#animCustomSelectors').value=x.customSelectors||'';$('#animSmoothScroll').checked=!!x.smoothScroll;$('#animCardHover').checked=!!x.cardHover;$('#animImageHover').checked=!!x.imageHover;$('#animButtonHover').checked=!!x.buttonHover;$('#animPremiumSpotlight').checked=!!x.premiumSpotlight;$('#animMagneticButtons').checked=!!x.magneticButtons;$('#animCountUp').checked=!!x.countUp;$('#animScrollProgress').checked=!!x.scrollProgress;$('#animHeroParallax').checked=!!x.heroParallax;playAnimationPreview();
  }
  function readAnimationForm(){
    const clamp=(n,min,max,fallback)=>Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
    return {enabled:animationValue('#animEnabled','bool'),respectReducedMotion:animationValue('#animRespectReduced','bool'),once:animationValue('#animOnce','bool'),preset:animationValue('#animPreset'),duration:clamp(animationValue('#animDuration','number'),100,5000,480),delay:clamp(animationValue('#animDelay','number'),0,5000,0),distance:clamp(animationValue('#animDistance','number'),0,200,14),stagger:clamp(animationValue('#animStagger','number'),0,1000,45),threshold:clamp(animationValue('#animThreshold','number'),0,1,.05),easing:animationValue('#animEasing'),autoSections:animationValue('#animAutoSections','bool'),autoCards:animationValue('#animAutoCards','bool'),autoText:animationValue('#animAutoText','bool'),autoImages:animationValue('#animAutoImages','bool'),autoButtons:animationValue('#animAutoButtons','bool'),customSelectors:animationValue('#animCustomSelectors'),smoothScroll:animationValue('#animSmoothScroll','bool'),cardHover:animationValue('#animCardHover','bool'),imageHover:animationValue('#animImageHover','bool'),buttonHover:animationValue('#animButtonHover','bool'),premiumSpotlight:animationValue('#animPremiumSpotlight','bool'),magneticButtons:animationValue('#animMagneticButtons','bool'),countUp:animationValue('#animCountUp','bool'),scrollProgress:animationValue('#animScrollProgress','bool'),heroParallax:animationValue('#animHeroParallax','bool')};
  }
  async function loadAnimations(){try{const d=await api('/api/admin/settings');state.settings=d.settings||state.settings||{};setAnimationForm(state.settings.animations)}catch(e){toast(e.message,true)}}
  async function saveAnimations(){try{const animations=readAnimationForm();const d=await api('/api/admin/settings',{method:'PUT',body:{animations}});state.settings=d.settings;setAnimationForm(animations);toast('Animation settings saved')}catch(e){toast(e.message,true)}}
  function resetAnimations(){if(!confirm('Reset animation controls to the recommended defaults? Save afterwards to apply them to the live site.'))return;setAnimationForm(animationDefaults);toast('Defaults loaded — click Save Animations to publish')}
  function playAnimationPreview(){const host=$('#animationPreview'),card=host?.querySelector('.preview-demo-card');if(!card)return;const a=readAnimationForm();card.className='preview-demo-card';void card.offsetWidth;card.style.setProperty('--preview-duration',a.duration+'ms');card.style.setProperty('--preview-delay',a.delay+'ms');card.style.setProperty('--preview-distance',a.distance+'px');card.style.setProperty('--preview-easing',a.easing);card.dataset.effect=a.preset;if(!a.enabled){card.classList.add('preview-visible');return}requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.add('preview-visible')))}

  async function loadPages(){try{const d=await api('/api/admin/pages');state.pages=d.pages;$('#pageSelect').innerHTML=d.pages.map(p=>`<option value="${escapeHtml(p.path)}">${escapeHtml(p.title)} — ${escapeHtml(p.path)}</option>`).join('');const first=d.pages.find(p=>p.path==='index.html')||d.pages[0];if(first){$('#pageSelect').value=first.path;await loadPage(first.path)}}catch(e){toast(e.message,true)}}
  async function createNewPage(){const raw=prompt('New page path (example: gallery.html or courses/new-course.html):','new-page.html');if(!raw)return;const title=prompt('Page title:','New Page')||'New Page';try{const d=await api('/api/admin/page/create',{method:'POST',body:{path:raw,title}});state.pageDirty=false;await refreshPagesAndSelect(d.path);toast('New page created')}catch(e){toast(e.message,true)}}
  async function duplicatePage(){if(!state.currentPage)return;const dir=state.currentPage.includes('/')?state.currentPage.slice(0,state.currentPage.lastIndexOf('/')+1):'';const raw=prompt('Duplicate page as:',dir+'copy.html');if(!raw)return;const title=prompt('New browser title (optional):','')||'';try{const d=await api('/api/admin/page/create',{method:'POST',body:{path:raw,title,from:state.currentPage}});state.pageDirty=false;await refreshPagesAndSelect(d.path);toast('Page duplicated')}catch(e){toast(e.message,true)}}
  async function deletePage(){if(!state.currentPage)return;if(!confirm(`Delete ${state.currentPage}? A backup will be kept.`))return;try{await api('/api/admin/page?path='+encodeURIComponent(state.currentPage),{method:'DELETE'});state.pageDirty=false;await refreshPagesAndSelect('index.html');toast('Page deleted')}catch(e){toast(e.message,true)}}
  async function refreshPagesAndSelect(path){const d=await api('/api/admin/pages');state.pages=d.pages;$('#pageSelect').innerHTML=d.pages.map(p=>`<option value="${escapeHtml(p.path)}">${escapeHtml(p.title)} — ${escapeHtml(p.path)}</option>`).join('');const target=d.pages.find(p=>p.path===path)||d.pages[0];if(target){$('#pageSelect').value=target.path;await loadPage(target.path)}}
  async function loadPage(page){if(!page)return;if(state.pageDirty&&!confirm('Discard unsaved page changes?')){$('#pageSelect').value=state.currentPage;return}try{const d=await api('/api/admin/page?path='+encodeURIComponent(page));state.currentPage=page;state.pageHtml=d.html;state.pageDirty=false;$('#pageSource').value=d.html;$('#pageFrame').src='/'+page+'?cms_edit='+Date.now();$('#openPage').href='/'+page;$('#pageSaveState').textContent='No unsaved changes';$('#pageSelect').value=page;clearInspector();$('#homepageHeroEditor').classList.toggle('hidden',page!=='index.html')}catch(e){toast(e.message,true)}}
  function markPageDirty(){state.pageDirty=true;$('#pageSaveState').textContent='Unsaved changes';$('#pageSaveState').style.color='#b77b00'}
  function clearInspector(){state.selectedEl=null;state.selectedPlainText='';state.selectedHtml='';state.selectedComputed={};$('#inspectorEmpty').classList.remove('hidden');$('#inspectorFields').classList.add('hidden');$('#selectedElementName').textContent='Select an element'}
  function setupFrameEditor(){
    const frame=$('#pageFrame');let doc;try{doc=frame.contentDocument}catch{return}if(!doc||!doc.body)return;
    const style=doc.createElement('style');style.setAttribute('data-admin-preview','');style.textContent='.program-card>a{pointer-events:none!important}.program-card>*:not(a){position:relative;z-index:2}[data-cms-hover]{outline:2px dashed #16a05a!important;outline-offset:2px!important;cursor:pointer!important}[data-cms-selected]{outline:3px solid #f0b900!important;outline-offset:3px!important}[data-cms-direct-edit]{outline:3px solid #2f7ef7!important;outline-offset:3px!important;cursor:text!important}';doc.head.appendChild(style);
    doc.addEventListener('mouseover',e=>{if(e.target&&e.target.setAttribute&&!e.target.hasAttribute('contenteditable'))e.target.setAttribute('data-cms-hover','')},true);
    doc.addEventListener('mouseout',e=>{if(e.target&&e.target.removeAttribute)e.target.removeAttribute('data-cms-hover')},true);
    doc.addEventListener('click',e=>{if(!e.target||['HTML','BODY'].includes(e.target.tagName)||e.target.getAttribute('contenteditable')==='true')return;e.preventDefault();e.stopPropagation();selectElement(e.altKey?e.target.closest('[data-cms-key]')||e.target:e.target)},true);
    doc.addEventListener('dblclick',e=>{const el=e.target;if(!isDirectEditableText(el))return;e.preventDefault();e.stopPropagation();beginDirectTextEdit(el)},true);
    doc.addEventListener('submit',e=>e.preventDefault(),true);
    $('#pageSeoTitle').value=doc.title||'';const md=doc.querySelector('meta[name="description"]');$('#pageSeoDescription').value=md?md.getAttribute('content')||'':'';
    loadHeroQuickEditor();
  }
  function isDirectEditableText(el){return !!el&&['H1','H2','H3','H4','P','SPAN','B','STRONG','EM','SMALL','A','BUTTON','LABEL','LI','SUMMARY'].includes(el.tagName)&&!el.closest('input,select,textarea')}
  function beginDirectTextEdit(el){
    if(el.closest('[data-shared]')){selectElement(el);toast('Use Global Header or Global Footer to edit this section.',true);return;}
    const doc=el.ownerDocument;doc.querySelectorAll('[data-cms-direct-edit]').forEach(x=>{x.removeAttribute('data-cms-direct-edit');x.removeAttribute('contenteditable')});selectElement(el);el.setAttribute('contenteditable','true');el.setAttribute('data-cms-direct-edit','');el.removeAttribute('data-cms-hover');el.focus();
    try{const r=doc.createRange();r.selectNodeContents(el);r.collapse(false);const sel=doc.getSelection();sel.removeAllRanges();sel.addRange(r)}catch{}
    const finish=()=>{el.removeAttribute('contenteditable');el.removeAttribute('data-cms-direct-edit');markPageDirty();selectElement(el);loadHeroQuickEditor();toast('Text updated in preview · click Save Page')};
    const onKey=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();el.blur()}if(e.key==='Escape'){e.preventDefault();el.blur()}};
    el.addEventListener('keydown',onKey,{once:false});el.addEventListener('blur',()=>{el.removeEventListener('keydown',onKey);finish()},{once:true});
  }
  function rgbToHex(value,fallback='#000000'){
    if(!value)return fallback;if(/^#[0-9a-f]{6}$/i.test(value))return value;
    const m=String(value).match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);if(!m)return fallback;return '#'+[m[1],m[2],m[3]].map(n=>Math.max(0,Math.min(255,Number(n))).toString(16).padStart(2,'0')).join('');
  }
  function loadHeroQuickEditor(){
    const panel=$('#homepageHeroEditor'),doc=$('#pageFrame').contentDocument;if(!panel||!doc||state.currentPage!=='index.html'){if(panel)panel.classList.add('hidden');return}panel.classList.remove('hidden');
    const get=k=>doc.querySelector(`[data-cms-key="${k}"]`), text=k=>get(k)?.textContent||'';
    $('#heroBadgeText').value=text('hero-badge');$('#heroLine1').value=text('hero-line-1');$('#heroLine2').value=text('hero-line-2');$('#heroLine3').value=text('hero-line-3');$('#heroDescription').value=text('hero-description');
    const p=get('hero-primary-button'),q=get('hero-secondary-button');$('#heroPrimaryText').value=p?.textContent||'';$('#heroPrimaryLink').value=p?.getAttribute('href')||'';$('#heroSecondaryText').value=q?.textContent||'';$('#heroSecondaryLink').value=q?.getAttribute('href')||'';
    $('#heroTrustPrefix').value=text('hero-trust-prefix');$('#heroTrustNumber').value=text('hero-trust-number');$('#heroTrustSuffix').value=text('hero-trust-suffix');$('#heroFormLabel').value=text('hero-form-label');$('#heroFormTitle').value=text('hero-form-title');$('#heroFormDescription').value=text('hero-form-description');$('#heroFormSubmit').value=text('hero-form-submit');$('#heroFormWhatsapp').value=text('hero-form-whatsapp');
    const hero=get('home-hero'),title=get('hero-title'),accent=get('hero-line-3');const csHero=hero?doc.defaultView.getComputedStyle(hero):null,csTitle=title?doc.defaultView.getComputedStyle(title):null,csAccent=accent?doc.defaultView.getComputedStyle(accent):null;
    const headingColor=rgbToHex(csTitle?.color,'#071c13'),accentColor=rgbToHex(csAccent?.color,'#087333'),bgColor=rgbToHex(csHero?.backgroundColor,'#ffffff');$('#heroHeadingColor').value=headingColor;$('#heroAccentColor').value=accentColor;$('#heroBackgroundColor').value=bgColor;state.heroInitial={headingColor,accentColor,bgColor};
  }
  function applyHeroQuickEditor(){
    const doc=$('#pageFrame').contentDocument;if(!doc||state.currentPage!=='index.html')return;const get=k=>doc.querySelector(`[data-cms-key="${k}"]`),setText=(k,id)=>{const el=get(k);if(el)el.textContent=$(id).value};
    setText('hero-badge','#heroBadgeText');setText('hero-line-1','#heroLine1');setText('hero-line-2','#heroLine2');setText('hero-line-3','#heroLine3');setText('hero-description','#heroDescription');setText('hero-trust-prefix','#heroTrustPrefix');setText('hero-trust-number','#heroTrustNumber');setText('hero-trust-suffix','#heroTrustSuffix');setText('hero-form-label','#heroFormLabel');setText('hero-form-title','#heroFormTitle');setText('hero-form-description','#heroFormDescription');setText('hero-form-submit','#heroFormSubmit');setText('hero-form-whatsapp','#heroFormWhatsapp');
    const p=get('hero-primary-button'),q=get('hero-secondary-button');if(p){p.textContent=$('#heroPrimaryText').value;p.setAttribute('href',$('#heroPrimaryLink').value||'#')}if(q){q.textContent=$('#heroSecondaryText').value;q.setAttribute('href',$('#heroSecondaryLink').value||'#')}
    const hero=get('home-hero'),title=get('hero-title'),accent=get('hero-line-3');if(title&&$('#heroHeadingColor').value!==state.heroInitial.headingColor)title.style.color=$('#heroHeadingColor').value;if(accent&&$('#heroAccentColor').value!==state.heroInitial.accentColor)accent.style.color=$('#heroAccentColor').value;if(hero&&$('#heroBackgroundColor').value!==state.heroInitial.bgColor)hero.style.background=$('#heroBackgroundColor').value;
    markPageDirty();loadHeroQuickEditor();toast('Homepage hero updated in preview · click Save Page');
  }
  function applyPageSeo(){const doc=$('#pageFrame').contentDocument;if(!doc)return;doc.title=$('#pageSeoTitle').value.trim();let md=doc.querySelector('meta[name="description"]');if(!md){md=doc.createElement('meta');md.name='description';doc.head.appendChild(md)}md.setAttribute('content',$('#pageSeoDescription').value.trim());markPageDirty();toast('SEO updated in preview')}
  function selectElement(el){
    const doc=$('#pageFrame').contentDocument;doc.querySelectorAll('[data-cms-selected]').forEach(x=>x.removeAttribute('data-cms-selected'));el.setAttribute('data-cms-selected','');state.selectedEl=el;
    $('#inspectorEmpty').classList.add('hidden');$('#inspectorFields').classList.remove('hidden');$('#selectedElementName').textContent=`<${el.tagName.toLowerCase()}>`+(el.id?' #'+el.id:'')+(el.className&&typeof el.className==='string'?' .'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'');
    state.selectedPlainText=el.innerText??el.textContent??'';state.selectedHtml=el.innerHTML;$('#elText').value=state.selectedPlainText;$('#elHtml').value=el.innerHTML;$('#elClass').value=typeof el.className==='string'?el.className:'';$('#elStyle').value=el.getAttribute('style')||'';$('#elOuter').value=el.outerHTML;
    const inlineSize=el.style.fontSize||'';$('#elFontSize').value=/px$/i.test(inlineSize)?parseFloat(inlineSize):'';const inlineWeight=String(el.style.fontWeight||'');$('#elFontWeight').value=['300','400','500','600','700','800','900'].includes(inlineWeight)?inlineWeight:'';
    try{const cs=el.ownerDocument.defaultView.getComputedStyle(el);$('#elFontComputed').textContent=`Current displayed style: ${cs.fontSize} · weight ${cs.fontWeight}`;const tc=rgbToHex(cs.color,'#000000'),bc=rgbToHex(cs.backgroundColor,'#ffffff');$('#elTextColor').value=tc;$('#elBackgroundColor').value=bc;$('#elTextAlign').value=['left','center','right','justify'].includes(cs.textAlign)?cs.textAlign:'';$('#elBorderRadius').value=el.style.borderRadius?parseFloat(el.style.borderRadius)||'':'';$('#elLineHeight').value=el.style.lineHeight&&el.style.lineHeight!=='normal'?parseFloat(el.style.lineHeight)||'':'';$('#elLetterSpacing').value=el.style.letterSpacing&&el.style.letterSpacing!=='normal'?parseFloat(el.style.letterSpacing)||'':'';state.selectedComputed={textColor:tc,backgroundColor:bc,textAlign:cs.textAlign};}catch{$('#elFontComputed').textContent='Use these controls to override the global typography for this element.';state.selectedComputed={}}
    $('#elAnimation').value=el.getAttribute('data-logic-animation')||'';$('#elAnimationDuration').value=el.getAttribute('data-logic-duration')||'';$('#elAnimationDelay').value=el.getAttribute('data-logic-delay')||'';$('#elAnimationDistance').value=el.getAttribute('data-logic-distance')||'';
    state.selectedOuter=el.outerHTML;const card=el.closest('[data-record-id]');const manage=$('#manageSelectedProgram');manage.hidden=!card;if(card)manage.href='/admin/content.html#programs/'+encodeURIComponent(card.dataset.recordId);const shared=el.closest('[data-shared]');const hint=$('#sharedEditHint');hint.hidden=!shared;if(shared){hint.replaceChildren();const a=document.createElement('a');a.href='/admin/layout.html#'+shared.dataset.shared;a.textContent='Edit this '+shared.dataset.shared+' globally →';hint.append(a);}
    const isLink=el.tagName==='A',isImg=el.tagName==='IMG';$('#hrefRow').classList.toggle('hidden',!isLink);$('#srcRow').classList.toggle('hidden',!isImg);$('#altRow').classList.toggle('hidden',!isImg);$('#elHref').value=isLink?(el.getAttribute('href')||''):'';$('#elSrc').value=isImg?(el.getAttribute('src')||''):'';$('#elAlt').value=isImg?(el.getAttribute('alt')||''):'';
    const imageHint=isImg?(el.getAttribute('data-cms-image-size')||''):'';const hintEl=$('#imageSizeHint');if(hintEl){hintEl.classList.toggle('hidden',!imageHint);hintEl.innerHTML=imageHint?`Recommended design size: <b>${escapeHtml(imageHint)}</b>. Upload it in Media Library, then use <b>Choose from Media</b> to replace this image.`:'';}
  }
  function applyElementChanges(){
    let el=state.selectedEl;if(!el)return;if(el.closest('[data-shared]')){toast('Use Global Header or Global Footer to save this change across the website.',true);return;}
    const outer=$('#elOuter').value.trim();
    if(outer && outer!==state.selectedOuter){const wrap=el.ownerDocument.createElement('div');wrap.innerHTML=outer;const replacement=wrap.firstElementChild;if(replacement){el.replaceWith(replacement);selectElement(replacement);markPageDirty();loadHeroQuickEditor();toast('Element HTML replaced');return}}
    const plain=$('#elText').value,rich=$('#elHtml').value;if(plain!==state.selectedPlainText)el.textContent=plain;else if(rich!==state.selectedHtml)el.innerHTML=rich;
    el.className=$('#elClass').value;const style=$('#elStyle').value.trim();style?el.setAttribute('style',style):el.removeAttribute('style');if(el.tagName==='A')el.setAttribute('href',$('#elHref').value);if(el.tagName==='IMG'){el.setAttribute('src',$('#elSrc').value);el.setAttribute('alt',$('#elAlt').value)}
    const fontSize=$('#elFontSize').value.trim(),fontWeight=$('#elFontWeight').value;fontSize?el.style.setProperty('font-size',clampValue(fontSize,6,220,16)+'px'):el.style.removeProperty('font-size');fontWeight?el.style.setProperty('font-weight',fontWeight):el.style.removeProperty('font-weight');
    const textColor=$('#elTextColor').value,backgroundColor=$('#elBackgroundColor').value;if(textColor&&textColor!==state.selectedComputed.textColor)el.style.setProperty('color',textColor);if(backgroundColor&&backgroundColor!==state.selectedComputed.backgroundColor)el.style.setProperty('background-color',backgroundColor);const align=$('#elTextAlign').value;align?el.style.setProperty('text-align',align):el.style.removeProperty('text-align');const radius=$('#elBorderRadius').value.trim(),lh=$('#elLineHeight').value.trim(),ls=$('#elLetterSpacing').value.trim();radius?el.style.setProperty('border-radius',clampValue(radius,0,200,0)+'px'):el.style.removeProperty('border-radius');lh?el.style.setProperty('line-height',clampValue(lh,.6,4,1.2)):el.style.removeProperty('line-height');ls?el.style.setProperty('letter-spacing',Math.max(-10,Math.min(30,Number(ls)||0))+'px'):el.style.removeProperty('letter-spacing');
    const effect=$('#elAnimation').value;effect?el.setAttribute('data-logic-animation',effect):el.removeAttribute('data-logic-animation');
    const duration=$('#elAnimationDuration').value.trim(),delay=$('#elAnimationDelay').value.trim(),distance=$('#elAnimationDistance').value.trim();duration?el.setAttribute('data-logic-duration',duration):el.removeAttribute('data-logic-duration');delay?el.setAttribute('data-logic-delay',delay):el.removeAttribute('data-logic-delay');distance?el.setAttribute('data-logic-distance',distance):el.removeAttribute('data-logic-distance');
    markPageDirty();selectElement(el);loadHeroQuickEditor();toast('Preview updated · click Save Page')
  }
  function duplicateSelectedElement(){const el=state.selectedEl;if(!el)return;const clone=el.cloneNode(true);clone.removeAttribute('data-cms-selected');clone.removeAttribute('data-cms-hover');el.insertAdjacentElement('afterend',clone);markPageDirty();selectElement(clone);loadHeroQuickEditor();toast('Element duplicated')}
  function moveSelectedElement(direction){const el=state.selectedEl;if(!el||!el.parentElement)return;const parent=el.parentElement;if(direction<0){const prev=el.previousElementSibling;if(!prev){toast('This element is already first',true);return}parent.insertBefore(el,prev)}else{const next=el.nextElementSibling;if(!next){toast('This element is already last',true);return}parent.insertBefore(next,el)}markPageDirty();selectElement(el);loadHeroQuickEditor();toast(direction<0?'Element moved up':'Element moved down')}
  function deleteSelectedElement(){const el=state.selectedEl;if(!el)return;if(!confirm('Delete this element from the page?'))return;el.remove();clearInspector();markPageDirty();loadHeroQuickEditor()}
  function insertElement(type){const el=state.selectedEl;if(!el)return;const doc=el.ownerDocument;let n;if(type==='p'){n=doc.createElement('p');n.textContent='New paragraph text'}else if(type==='h2'){n=doc.createElement('h2');n.textContent='New heading'}else if(type==='img'){n=doc.createElement('img');n.src='/assets/images/students.jpg';n.alt='New image'}else{n=doc.createElement('section');n.className='section';n.innerHTML='<div class="container"><h2>New section</h2><p>Add your content here.</p></div>'}el.insertAdjacentElement('afterend',n);markPageDirty();selectElement(n)}
  function serializedFrameHtml(){const doc=$('#pageFrame').contentDocument;if(!doc||!doc.documentElement)return state.pageHtml;const clone=doc.documentElement.cloneNode(true);clone.querySelectorAll('[data-admin-preview]').forEach(x=>x.remove());clone.querySelectorAll('[data-cms-hover],[data-cms-selected],[data-cms-direct-edit]').forEach(x=>{x.removeAttribute('data-cms-hover');x.removeAttribute('data-cms-selected');x.removeAttribute('data-cms-direct-edit');x.removeAttribute('contenteditable')});return '<!doctype html>\n'+clone.outerHTML}
  async function saveCurrentPage(){if(!state.currentPage)return;let html=$('#sourceEditor').classList.contains('hidden')?serializedFrameHtml():$('#pageSource').value;try{await api('/api/admin/page?path='+encodeURIComponent(state.currentPage),{method:'PUT',body:{html}});state.pageDirty=false;state.pageHtml=html;$('#pageSource').value=html;$('#pageSaveState').textContent='Saved just now';$('#pageSaveState').style.color='#2b8a51';toast('Page saved · backup created');loadBackups()}catch(e){toast(e.message,true)}}
  function showSourceMode(){const html=serializedFrameHtml();$('#pageSource').value=html;$('#visualEditor').classList.add('hidden');$('#sourceEditor').classList.remove('hidden');$('#sourceMode').classList.add('active');$('#visualMode').classList.remove('active')}
  function showVisualMode(){if(state.pageDirty && $('#sourceEditor').classList.contains('hidden')===false && !confirm('Visual mode reloads the last saved page. Save source changes first, or continue to discard them.'))return;$('#visualEditor').classList.remove('hidden');$('#sourceEditor').classList.add('hidden');$('#visualMode').classList.add('active');$('#sourceMode').classList.remove('active');if(state.currentPage)$('#pageFrame').src='/'+state.currentPage+'?cms_edit='+Date.now()}

  async function loadMedia(){try{const d=await api('/api/admin/media');state.media=d.media;renderMedia();renderModalMedia()}catch(e){toast(e.message,true)}}
  function renderMedia(){const q=($('#mediaSearch')?.value||'').toLowerCase();const list=state.media.filter(m=>!q||m.name.toLowerCase().includes(q));if($('#mediaCount'))$('#mediaCount').textContent=`${list.length} file${list.length===1?'':'s'}`;if($('#mediaGrid'))$('#mediaGrid').innerHTML=list.length?list.map(mediaCard).join(''):'<div class="empty-state">No matching media files.</div>';wireMediaButtons()}
  function mediaCard(m,modal=false){return `<article class="media-card" data-url="${escapeHtml(m.url)}"><div class="thumb"><img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.name)}" loading="lazy"></div><div class="media-info"><b title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</b><span>${formatBytes(m.bytes)}</span>${modal?'':'<div class="media-actions"><button class="copy-url">Copy URL</button><button class="delete">Delete</button></div>'}</div></article>`}
  function wireMediaButtons(){ $$('#mediaGrid .copy-url').forEach(b=>b.onclick=()=>{navigator.clipboard.writeText(b.closest('.media-card').dataset.url);toast('Image URL copied')});$$('#mediaGrid .delete').forEach(b=>b.onclick=()=>deleteMedia(b.closest('.media-card').dataset.url)) }
  function renderModalMedia(){if(!$('#modalMediaGrid'))return;$('#modalMediaGrid').innerHTML=state.media.map(m=>mediaCard(m,true)).join('');$$('#modalMediaGrid .media-card').forEach(c=>c.onclick=()=>chooseMedia(c.dataset.url))}
  async function uploadFiles(files,fromModal=false){if(!files.length)return;for(const f of files){if(f.size>20*1024*1024){toast(`${f.name} exceeds 20 MB`,true);continue}if(!f.type.startsWith('image/')){toast(`${f.name} is not an image`,true);continue}try{const data=await fileAsDataUrl(f);await api('/api/admin/media/upload',{method:'POST',body:{name:f.name,data}});toast(`Uploaded ${f.name}`)}catch(e){toast(`${f.name}: ${e.message}`,true)}}await loadMedia();if(fromModal)renderModalMedia();$('#mediaUpload').value='';$('#modalUpload').value=''}
  function fileAsDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
  async function deleteMedia(url){if(!confirm('Delete this image file? Pages using it will show a broken image until replaced.'))return;try{await api('/api/admin/media?url='+encodeURIComponent(url),{method:'DELETE'});await loadMedia();toast('Image deleted')}catch(e){toast(e.message,true)}}
  function openMediaModal(purpose){state.mediaPurpose=purpose;renderModalMedia();$('#mediaModal').classList.remove('hidden')}
  function closeMediaModal(){$('#mediaModal').classList.add('hidden');state.mediaPurpose=null}
  function chooseMedia(url){if(state.mediaPurpose==='logo'){$('#setLogoUrl').value=url;renderLogoPreview()}else if(String(state.mediaPurpose||'').startsWith('social:')){const idx=Number(String(state.mediaPurpose).split(':')[1]),row=$(`#socialLinksEditor .social-edit-row[data-social-index="${idx}"]`);if(row){const input=row.querySelector('.social-icon-url');if(input)input.value=url;refreshSocialEditorPreviews()}}else if(state.mediaPurpose==='element'&&state.selectedEl){$('#elSrc').value=url;state.selectedEl.setAttribute('src',url);$('#elOuter').value=state.selectedEl.outerHTML;markPageDirty()}closeMediaModal()}


  function brochureDefaultsFromSettings(){
    const existing=state.settings?.brochures||{};const courses={};
    brochureCourses.forEach(([slug,label])=>{const x=existing.courses?.[slug]||{};courses[slug]={enabled:!!x.enabled,label:x.label||`Download ${label} Brochure`,url:x.url||''}});
    const m=existing.master||{};return {master:{enabled:!!m.enabled,label:m.label||'Download All Course Brochure',url:m.url||''},courses};
  }
  function renderBrochureCourses(data){
    const host=$('#courseBrochureGrid');if(!host)return;host.innerHTML=brochureCourses.map(([slug,label])=>{const x=data.courses[slug];return `<article class="panel brochure-course-card" data-brochure-course="${slug}"><div class="brochure-card-title"><div><span class="course-mini-tag">${escapeHtml(label)}</span><h3>${escapeHtml(label)} brochure</h3></div><span class="pdf-badge">PDF</span></div><label class="toggle-row"><input class="brochure-enabled" type="checkbox"${x.enabled?' checked':''}><span>Show download button</span></label><label>Button text<input class="brochure-label" value="${escapeHtml(x.label)}"></label><label>PDF URL<input class="brochure-url" value="${escapeHtml(x.url)}" placeholder="Upload a PDF below"></label><input data-brochure-file="${slug}" type="file" accept="application/pdf" hidden><div class="brochure-upload-actions"><button class="secondary" type="button" data-upload-brochure="${slug}">Upload / Replace PDF</button>${x.url?`<a class="secondary button-link" href="${escapeHtml(x.url)}" target="_blank" rel="noopener">Open PDF ↗</a>`:''}</div></article>`}).join('');
  }
  async function loadBrochures(){try{const d=await api('/api/admin/settings');state.settings=d.settings||state.settings||{};const data=brochureDefaultsFromSettings();$('#masterBrochureEnabled').checked=data.master.enabled;$('#masterBrochureLabel').value=data.master.label;$('#masterBrochureUrl').value=data.master.url;const open=$('#openMasterBrochure');open.classList.toggle('hidden',!data.master.url);if(data.master.url)open.href=data.master.url;renderBrochureCourses(data)}catch(e){toast(e.message,true)}}
  function readBrochures(){const courses={};$$('#courseBrochureGrid [data-brochure-course]').forEach(card=>{courses[card.dataset.brochureCourse]={enabled:card.querySelector('.brochure-enabled').checked,label:card.querySelector('.brochure-label').value.trim()||'Download Brochure',url:card.querySelector('.brochure-url').value.trim()}});return {master:{enabled:$('#masterBrochureEnabled').checked,label:$('#masterBrochureLabel').value.trim()||'Download All Course Brochure',url:$('#masterBrochureUrl').value.trim()},courses}}
  async function saveBrochures(){try{const brochures=readBrochures();const d=await api('/api/admin/settings',{method:'PUT',body:{brochures}});state.settings=d.settings;toast('Brochure settings saved')}catch(e){toast(e.message,true)}}
  async function uploadBrochureFile(file,target){if(!file)return;if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){toast('Please choose a PDF file',true);return}try{toast('Uploading brochure…');const data=await fileAsDataUrl(file);const d=await api('/api/admin/brochure/upload',{method:'POST',body:{name:file.name,data}});if(target==='master'){$('#masterBrochureUrl').value=d.file.url;$('#masterBrochureEnabled').checked=true;$('#openMasterBrochure').href=d.file.url;$('#openMasterBrochure').classList.remove('hidden');$('#masterBrochureFile').value=''}else{const card=$(`[data-brochure-course="${target}"]`);if(card){card.querySelector('.brochure-url').value=d.file.url;card.querySelector('.brochure-enabled').checked=true;const actions=card.querySelector('.brochure-upload-actions');let a=actions.querySelector('a');if(!a){a=document.createElement('a');a.className='secondary button-link';a.target='_blank';a.rel='noopener';a.textContent='Open PDF ↗';actions.appendChild(a)}a.href=d.file.url;card.querySelector('[data-brochure-file]').value=''}}await saveBrochures();toast(`Uploaded ${file.name}`)}catch(e){toast(e.message,true)}}

  function setTrackingForm(value){
    const x={...trackingDefaults,...(value||{})};
    $('#trackingEnabled').checked=!!x.enabled;
    $('#gtmEnabled').checked=!!x.gtmEnabled;$('#gtmId').value=x.gtmId||'';
    $('#ga4Enabled').checked=!!x.ga4Enabled;$('#ga4Id').value=x.ga4Id||'';
    $('#metaEnabled').checked=!!x.metaEnabled;$('#metaPixelId').value=x.metaPixelId||'';
    $('#trackingConversions').checked=x.trackConversions!==false;
    $('#trackingContactClicks').checked=x.trackContactClicks!==false;
  }
  function readTrackingForm(){
    const gtmId=$('#gtmId').value.trim().toUpperCase(),ga4Id=$('#ga4Id').value.trim().toUpperCase(),metaPixelId=$('#metaPixelId').value.trim();
    if($('#gtmEnabled').checked&&!/^GTM-[A-Z0-9]+$/.test(gtmId))throw new Error('Enter a valid Google Tag Manager ID such as GTM-XXXXXXX');
    if($('#ga4Enabled').checked&&!/^G-[A-Z0-9]+$/.test(ga4Id))throw new Error('Enter a valid GA4 Measurement ID such as G-XXXXXXXXXX');
    if($('#metaEnabled').checked&&!/^\d{5,30}$/.test(metaPixelId))throw new Error('Enter a valid numeric Meta Pixel ID');
    return {enabled:$('#trackingEnabled').checked,gtmEnabled:$('#gtmEnabled').checked,gtmId,ga4Enabled:$('#ga4Enabled').checked,ga4Id,metaEnabled:$('#metaEnabled').checked,metaPixelId,trackConversions:$('#trackingConversions').checked,trackContactClicks:$('#trackingContactClicks').checked};
  }
  async function loadTracking(){try{const d=await api('/api/admin/settings');state.settings=d.settings||state.settings||{};setTrackingForm(state.settings.tracking);const st=$('#trackingSaveStatus');if(st){st.textContent=state.settings.tracking?.enabled?'Tracking configuration loaded.':'Tracking is currently disabled.';st.className='integration-status '+(state.settings.tracking?.enabled?'ok':'')}}catch(e){toast(e.message,true)}}
  async function saveTracking(){const status=$('#trackingSaveStatus');try{const tracking=readTrackingForm();const d=await api('/api/admin/settings',{method:'PUT',body:{tracking}});state.settings=d.settings;setTrackingForm(state.settings.tracking);if(status){status.textContent=tracking.enabled?'Tracking saved and active on public pages.':'Tracking settings saved; master tracking is disabled.';status.className='integration-status ok'}toast('Tracking & Analytics saved')}catch(e){if(status){status.textContent=e.message;status.className='integration-status error'}toast(e.message,true)}}

  function toggleIntegrationMode(){const mode=$('#crmMode').value;$('#odooDirectFields').classList.toggle('hidden',mode!=='odoo');$('#webhookFields').classList.toggle('hidden',mode!=='webhook')}
  function renderIntegrationLog(logs=[]){const host=$('#integrationLog');if(!host)return;host.innerHTML=logs.length?logs.map(x=>`<div class="integration-log-row ${x.ok?'ok':'error'}"><span class="sync-dot"></span><div><b>${x.ok?'Synced':'Sync failed'} · ${escapeHtml(x.mode||'CRM')}</b><small>${escapeHtml(x.name||x.phone||x.kind||'Website lead')}${x.leadId?` · Odoo #${escapeHtml(x.leadId)}`:''}${x.error?` · ${escapeHtml(x.error)}`:''}</small></div><time>${escapeHtml(formatDate(x.at))}</time></div>`).join(''):'<div class="empty-state">No CRM sync attempts yet.</div>'}
  async function loadIntegration(){try{const d=await api('/api/admin/integrations'),x=d.integration||{};$('#crmEnabled').checked=!!x.enabled;$('#crmMode').value=x.mode||'disabled';$('#odooBaseUrl').value=x.baseUrl||'';$('#odooDatabase').value=x.database||'';$('#odooUsername').value=x.username||'';$('#odooApiKey').value='';$('#odooApiKey').placeholder=x.apiKeyConfigured?'API key saved — leave blank to keep it':'Enter Odoo API key';$('#odooModel').value=x.model||'leads.logic';$('#odooFieldMap').value=x.customFieldMap||'';$('#crmWebhookUrl').value=x.webhookUrl||'';$('#crmWebhookSecret').value='';$('#crmWebhookSecret').placeholder=x.webhookSecretConfigured?'Secret saved — leave blank to keep it':'Optional bearer secret';toggleIntegrationMode();renderIntegrationLog(d.logs||[])}catch(e){toast(e.message,true)}}
  function readIntegrationForm(){const body={enabled:$('#crmEnabled').checked,mode:$('#crmMode').value,baseUrl:$('#odooBaseUrl').value.trim(),database:$('#odooDatabase').value.trim(),username:$('#odooUsername').value.trim(),apiKey:$('#odooApiKey').value.trim(),model:$('#odooModel').value.trim()||'leads.logic',customFieldMap:$('#odooFieldMap').value.trim(),webhookUrl:$('#crmWebhookUrl').value.trim(),webhookSecret:$('#crmWebhookSecret').value.trim()};if(body.customFieldMap){try{JSON.parse(body.customFieldMap)}catch{throw new Error('Custom field mapping must be valid JSON')}}return body}
  async function saveIntegration(){try{await api('/api/admin/integrations',{method:'PUT',body:readIntegrationForm()});$('#integrationStatus').textContent='Integration settings saved.';$('#integrationStatus').className='integration-status ok';await loadIntegration();toast('CRM integration saved')}catch(e){$('#integrationStatus').textContent=e.message;$('#integrationStatus').className='integration-status error';toast(e.message,true)}}
  async function testIntegration(){const status=$('#integrationStatus');try{await api('/api/admin/integrations',{method:'PUT',body:readIntegrationForm()});status.textContent='Testing connection…';status.className='integration-status';const d=await api('/api/admin/integrations/test',{method:'POST',body:{}});status.textContent=d.message||'Connection successful.';status.className='integration-status ok';await loadIntegration();$('#integrationStatus').textContent=d.message||'Connection successful.';$('#integrationStatus').className='integration-status ok';toast('Connection successful')}catch(e){status.textContent=e.message;status.className='integration-status error';toast(e.message,true)}}

  async function loadLeads(){try{const d=await api('/api/admin/leads');$('#leadsBody').innerHTML=d.leads.length?d.leads.map(l=>`<tr><td>${escapeHtml(formatDate(l.receivedAt))}</td><td><span class="lead-type">${escapeHtml(l.kind||'lead')}</span></td><td><b>${escapeHtml(l.name||'—')}</b></td><td>${escapeHtml(l.phone||'—')}</td><td>${escapeHtml(l.email||'—')}</td><td>${escapeHtml(l.course||'—')}</td><td>${escapeHtml(l.branch||'—')}</td><td>${escapeHtml(l.source||l.page||'—')}</td></tr>`).join(''):'<tr><td colspan="8">No leads yet.</td></tr>'}catch(e){toast(e.message,true)}}
  async function clearLeads(){if(!confirm('Permanently clear all stored website leads? Export CSV first if you need a copy.'))return;try{await api('/api/admin/leads',{method:'DELETE'});await loadLeads();loadDashboard();toast('All leads cleared')}catch(e){toast(e.message,true)}}

  async function loadDevFile(){try{const p=$('#devFileSelect').value;const d=await api('/api/admin/file?path='+encodeURIComponent(p));$('#devEditor').value=d.content}catch(e){toast(e.message,true)}}
  async function saveDevFile(){try{const p=$('#devFileSelect').value;await api('/api/admin/file?path='+encodeURIComponent(p),{method:'PUT',body:{content:$('#devEditor').value}});toast('File saved · backup created');loadBackups()}catch(e){toast(e.message,true)}}
  async function loadBackups(){try{const d=await api('/api/admin/backups');$('#backupList').innerHTML=d.backups.length?d.backups.slice(0,30).map(b=>`<div class="backup-row"><div><b>${escapeHtml(b.name)}</b><span>${formatDate(b.modified)} · ${formatBytes(b.bytes)}</span></div><button class="secondary restore-backup" data-name="${escapeHtml(b.name)}">Restore</button></div>`).join(''):'<div class="empty-state">Backups appear automatically when you save a page or advanced file.</div>';$$('.restore-backup').forEach(b=>b.onclick=()=>restoreBackup(b.dataset.name))}catch(e){toast(e.message,true)}}
  async function restoreBackup(name){if(!confirm('Restore this backup? The current page is backed up first.'))return;try{const d=await api('/api/admin/restore-backup',{method:'POST',body:{name}});toast('Backup restored');if(d.path===state.currentPage)loadPage(state.currentPage);loadBackups()}catch(e){toast(e.message,true)}}

  async function changePassword(e){e.preventDefault();const fd=Object.fromEntries(new FormData(e.currentTarget));const status=$('#passwordStatus');if(fd.newPassword!==fd.confirmPassword){status.textContent='Passwords do not match';status.style.color='#b12f2f';return}try{const d=await api('/api/admin/change-password',{method:'POST',body:{currentPassword:fd.currentPassword,newPassword:fd.newPassword}});status.textContent=d.message;status.style.color='#247d49';e.currentTarget.reset();setTimeout(showLogin,900)}catch(err){status.textContent=err.message;status.style.color='#b12f2f'}}

  boot();
})();
