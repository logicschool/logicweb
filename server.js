const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const ROOT = __dirname;
let databaseSettings=null;
const renderService=require('./server/services/render');
const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const SETTINGS_FILE = path.join(DATA_DIR, 'site-settings.json');
const AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.ndjson');
const INTEGRATIONS_FILE = path.join(DATA_DIR, 'integrations.json');
const INTEGRATION_LOG_FILE = path.join(DATA_DIR, 'integration-log.ndjson');
const BROCHURE_DIR = path.join(UPLOAD_DIR, 'brochures');
const MAX_JSON = 48 * 1024 * 1024;
const MAX_UPLOAD = 10 * 1024 * 1024;
const MAX_BROCHURE = 30 * 1024 * 1024;
const SESSION_TTL = 12 * 60 * 60 * 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.mkdirSync(BROCHURE_DIR, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.pdf': 'application/pdf'
};

const sessions = new Map();
const loginAttempts = new Map();
const brochureDownloadTokens = new Map();
const BROCHURE_TOKEN_TTL = 10 * 60 * 1000;

function json(res, code, obj, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(obj));
}
function text(res, code, body, type = 'text/plain; charset=utf-8', headers = {}) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('='); if (i < 0) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
function sessionFor(req) { return req.adminUser ? {username:req.adminUser.username} : null; }
function requireAdmin(req, res) {
  const s = sessionFor(req);
  if (!s) { json(res, 401, { ok: false, error: 'Authentication required' }); return null; }
  return s;
}
function readBody(req, max = MAX_JSON) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; if (Buffer.byteLength(body) > max) reject(new Error('Payload too large')); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
async function readJson(req, max = MAX_JSON) {
  if(req.body!==undefined)return req.body;
  const body = await readBody(req, max);
  return JSON.parse(body || '{}');
}
function safeReadJson(file, fallback) {
  if(file===SETTINGS_FILE && databaseSettings)return databaseSettings;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function atomicWrite(file, content) {
  const tmp = file + '.tmp'; fs.writeFileSync(tmp, content); fs.renameSync(tmp, file);
}
function listPages() {
  const pages = [];
  function walk(dir, rel = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['admin', 'data', 'uploads', 'node_modules','partials','server','test','scripts','blog'].includes(entry.name)) continue;
      const abs = path.join(dir, entry.name); const r = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) walk(abs, r);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = fs.readFileSync(abs, 'utf8');
        const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [,''])[1].replace(/<[^>]+>/g,'').trim();
        pages.push({ path: r, title: title || r, modified: fs.statSync(abs).mtime.toISOString() });
      }
    }
  }
  walk(ROOT);
  return pages.sort((a,b) => a.path.localeCompare(b.path));
}
function safePagePath(p) {
  p = String(p || '').replace(/^\/+/, '').replace(/\\/g, '/');
  if (!p.endsWith('.html') || !/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/i.test(p) || /^(admin|data|server|partials|node_modules|test|scripts)\//.test(p) || p.includes('../')) return null;
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT + path.sep)) return null;
  return { abs, rel: p };
}
function backupPage(rel, html) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `${stamp}__${rel.replace(/[\\/]/g, '__')}`;
  fs.writeFileSync(path.join(BACKUP_DIR, name), html);
}
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR).filter(n => n.includes('__')).map(name => {
    const abs = path.join(BACKUP_DIR, name); const parts = name.split('__');
    const stamp = parts.shift(); const page = parts.join('/').replace(/\.html$/, '.html');
    return { name, page, modified: fs.statSync(abs).mtime.toISOString(), bytes: fs.statSync(abs).size };
  }).sort((a,b) => b.modified.localeCompare(a.modified));
}
function sanitizeFilename(name) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'media';
  return `${base}-${Date.now()}${ext}`;
}
function mediaFiles() {
  const files = [];
  const allowedExt = new Set(['.jpg','.jpeg','.png','.webp','.gif','.svg','.ico']);
  const addDir = (dir, urlBase, managed) => {
    if (!fs.existsSync(dir)) return;
    for (const n of fs.readdirSync(dir)) {
      const abs = path.join(dir, n); if(fs.statSync(abs).isDirectory()){if(n!=='brochures')addDir(abs,urlBase+'/'+n,managed);continue;} if (!fs.statSync(abs).isFile()) continue;
      if (!allowedExt.has(path.extname(n).toLowerCase())) continue;
      const st = fs.statSync(abs);
      files.push({ name:n, url:`${urlBase}/${encodeURIComponent(n)}`, managed, bytes:st.size, modified:st.mtime.toISOString() });
    }
  };
  addDir(UPLOAD_DIR, '/uploads', true);
  addDir(path.join(ROOT, 'assets', 'images'), '/assets/images', true);
  addDir(path.join(ROOT,'assets','course-icons'),'/assets/course-icons',true);
  return files.sort((a,b)=>b.modified.localeCompare(a.modified));
}
function saveLead(kind, data) {
  const safe = { kind, receivedAt: new Date().toISOString(), ...data };
  fs.appendFileSync(LEADS_FILE, JSON.stringify(safe) + '\n');
}
function readLeads() {
  try { return fs.readFileSync(LEADS_FILE,'utf8').split(/\r?\n/).filter(Boolean).map((line, i) => ({ id:i+1, ...JSON.parse(line) })).reverse(); }
  catch { return []; }
}
function csvCell(v) { const s = String(v == null ? '' : v).replace(/"/g,'""'); return `"${s}"`; }
function leadsCsv() {
  const leads = readLeads().slice().reverse();
  const keys = [...new Set(leads.flatMap(x => Object.keys(x)))];
  return [keys.map(csvCell).join(','), ...leads.map(l => keys.map(k=>csvCell(l[k])).join(','))].join('\n');
}

function trackingDefaults() {
  return {
    enabled:false,
    gtmEnabled:false, gtmId:'',
    ga4Enabled:false, ga4Id:'',
    metaEnabled:false, metaPixelId:'',
    trackConversions:true,
    trackContactClicks:true
  };
}
function normalizeTracking(value) {
  const x={...trackingDefaults(),...(value||{})};
  const gtmId=String(x.gtmId||'').trim().toUpperCase();
  const ga4Id=String(x.ga4Id||'').trim().toUpperCase();
  const metaPixelId=String(x.metaPixelId||'').trim();
  return {
    enabled:!!x.enabled,
    gtmEnabled:!!x.gtmEnabled,
    gtmId:/^GTM-[A-Z0-9]+$/.test(gtmId)?gtmId:'',
    ga4Enabled:!!x.ga4Enabled,
    ga4Id:/^G-[A-Z0-9]+$/.test(ga4Id)?ga4Id:'',
    metaEnabled:!!x.metaEnabled,
    metaPixelId:/^\d{5,30}$/.test(metaPixelId)?metaPixelId:'',
    trackConversions:x.trackConversions!==false,
    trackContactClicks:x.trackContactClicks!==false
  };
}
function currentTracking() {
  const settings=safeReadJson(SETTINGS_FILE,{});
  return normalizeTracking(settings.tracking||{});
}
function trackingHeadMarkup() {
  const t=currentTracking();
  if(!t.enabled) return '';
  const out=[];
  if(t.gtmEnabled&&t.gtmId){
    const id=JSON.stringify(t.gtmId);
    out.push(`<!-- Logic CMS · Google Tag Manager -->\n<script data-logic-tracking=\"gtm\">(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${id});</script>`);
  }
  if(t.ga4Enabled&&t.ga4Id){
    const id=t.ga4Id;
    out.push(`<!-- Logic CMS · Google Analytics 4 -->\n<script async data-logic-tracking=\"ga4-loader\" src=\"https://www.googletagmanager.com/gtag/js?id=${id}\"></script>\n<script data-logic-tracking=\"ga4\">window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${id}');</script>`);
  }
  if(t.metaEnabled&&t.metaPixelId){
    const id=t.metaPixelId;
    out.push(`<!-- Logic CMS · Meta Pixel -->\n<script data-logic-tracking=\"meta\">!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');</script>`);
  }
  if(out.length){
    out.unshift(`<script data-logic-tracking=\"config\">window.LOGIC_TRACKING=${JSON.stringify(t)};</script>`);
  }
  return out.join('\n');
}
function trackingBodyMarkup() {
  const t=currentTracking();
  if(!t.enabled) return '';
  const out=[];
  if(t.gtmEnabled&&t.gtmId) out.push(`<!-- Logic CMS · Google Tag Manager (noscript) --><noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id=${t.gtmId}\" height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript>`);
  if(t.metaEnabled&&t.metaPixelId) out.push(`<!-- Logic CMS · Meta Pixel (noscript) --><noscript><img height=\"1\" width=\"1\" style=\"display:none\" alt=\"\" src=\"https://www.facebook.com/tr?id=${t.metaPixelId}&ev=PageView&noscript=1\"></noscript>`);
  return out.join('\n');
}
function injectTrackingIntoHtml(html) {
  if(!html || html.includes('data-logic-tracking="config"')) return html;
  const head=trackingHeadMarkup(),body=trackingBodyMarkup();
  if(head){
    if(/<\/head>/i.test(html)) html=html.replace(/<\/head>/i,head+'\n</head>');
    else html=head+'\n'+html;
  }
  if(body){
    if(/<body\b[^>]*>/i.test(html)) html=html.replace(/<body\b[^>]*>/i,m=>m+'\n'+body);
    else html=body+'\n'+html;
  }
  return html;
}

function integrationDefaults() {
  return { enabled:false, mode:'disabled', baseUrl:'', database:'', username:'', apiKey:'', model:'leads.logic', customFieldMap:'', webhookUrl:'', webhookSecret:'' };
}
function readIntegrations() { return { ...integrationDefaults(), ...safeReadJson(INTEGRATIONS_FILE,{}), ...(process.env.ODOO_API_KEY?{apiKey:process.env.ODOO_API_KEY}:{}), ...(process.env.CRM_WEBHOOK_SECRET?{webhookSecret:process.env.CRM_WEBHOOK_SECRET}:{}) }; }
function adminIntegrationView() {
  const x=readIntegrations();
  return { ...x, apiKey:'', webhookSecret:'', apiKeyConfigured:!!x.apiKey, webhookSecretConfigured:!!x.webhookSecret };
}
function integrationLog(entry) {
  try { fs.appendFileSync(INTEGRATION_LOG_FILE, JSON.stringify({ at:new Date().toISOString(), ...entry })+'\n'); } catch {}
}
function readIntegrationLog(limit=30) {
  try { return fs.readFileSync(INTEGRATION_LOG_FILE,'utf8').split(/\r?\n/).filter(Boolean).slice(-limit).reverse().map(x=>JSON.parse(x)); } catch { return []; }
}
function brochureFiles() {
  if(!fs.existsSync(BROCHURE_DIR)) return [];
  return fs.readdirSync(BROCHURE_DIR).filter(n=>path.extname(n).toLowerCase()==='.pdf').map(n=>{
    const abs=path.join(BROCHURE_DIR,n), st=fs.statSync(abs);
    return { name:n, url:'/uploads/brochures/'+encodeURIComponent(n), bytes:st.size, modified:st.mtime.toISOString() };
  }).sort((a,b)=>b.modified.localeCompare(a.modified));
}

function publicBrochureView() {
  const settings=safeReadJson(SETTINGS_FILE,{});
  const brochures=settings.brochures||{};
  const cleanOne=x=>({
    enabled:!!x?.enabled,
    label:String(x?.label||'Download Brochure'),
    available:!!String(x?.url||'').trim()
  });
  const courses={};
  for(const [slug,value] of Object.entries(brochures.courses||{})) courses[slug]=cleanOne(value);
  return {master:cleanOne(brochures.master),courses};
}
function brochureConfigForKind(kind) {
  const brochures=safeReadJson(SETTINGS_FILE,{}).brochures||{};
  if(kind==='master') return brochures.master||null;
  return brochures.courses?.[kind]||null;
}
function createBrochureDownloadToken(brochureUrl) {
  const now=Date.now();
  for(const [token,rec] of brochureDownloadTokens) if(!rec||rec.expiresAt<=now) brochureDownloadTokens.delete(token);
  const token=crypto.randomBytes(24).toString('hex');
  brochureDownloadTokens.set(token,{url:String(brochureUrl),expiresAt:now+BROCHURE_TOKEN_TTL});
  return token;
}
function serveBrochureDownload(res,token) {
  const rec=brochureDownloadTokens.get(String(token||''));
  if(!rec||Date.now()>rec.expiresAt){if(rec)brochureDownloadTokens.delete(String(token||''));return json(res,410,{ok:false,error:'This brochure download link has expired. Please submit the form again.'});}
  brochureDownloadTokens.delete(String(token||''));
  const target=String(rec.url||'');
  if(target.startsWith('/uploads/brochures/')){
    let name='';try{name=decodeURIComponent(target.split('/').pop()||'')}catch{name=target.split('/').pop()||''}
    name=path.basename(name);const abs=path.join(BROCHURE_DIR,name);
    if(!name||!fs.existsSync(abs))return json(res,404,{ok:false,error:'Brochure file not found'});
    const buf=fs.readFileSync(abs);
    res.writeHead(200,{'Content-Type':'application/pdf','Content-Length':buf.length,'Content-Disposition':`attachment; filename="${name.replace(/["\r\n]/g,'_')}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    return res.end(buf);
  }
  if(/^https?:\/\//i.test(target)){res.writeHead(302,{'Location':target,'Cache-Control':'no-store'});return res.end();}
  return json(res,400,{ok:false,error:'The brochure URL is not configured correctly'});
}
function compactLeadDescription(kind,data) {
  const keys=['course','branch','mode','source','page','qualification','message','recommendation','formType','brochureKind','brochureLabel'];
  const lines=[`Website form: ${kind}`];
  for(const k of keys) if(data[k]!==undefined && data[k]!==null && String(data[k]).trim()) lines.push(`${k}: ${String(data[k]).trim()}`);
  return lines.join('\n');
}
function crmSourceForLead(kind,data={}) {
  const formType=String(data.formType||'').trim().toLowerCase();
  const existing=String(data.source||'').trim();
  if(/^website\s+/i.test(existing)) return existing;
  if(kind==='brochure'||formType==='brochure download'||existing==='brochure-download') return 'Website Brochure';
  if(formType==='placement assistance') return 'Website Placement Assistance';
  if(formType==='career test') return 'Website Career Test';
  if(kind==='contact') return 'Website Contact';
  if(kind==='newsletter') return 'Website Newsletter';
  return 'Website Enquiry';
}
async function ensureOdooLeadSource(cfg,uid,sourceName) {
  const ids=await odooRpc(cfg.baseUrl,'object','execute_kw',[cfg.database,uid,cfg.apiKey,'leads.sources','search',[[['name','=',sourceName]]],{'limit':1}]);
  if(Array.isArray(ids)&&ids.length) return Number(ids[0]);

  // Odoo create() expects one values dictionary here. Passing [[{...}]] invokes
  // multi-create semantics and can return [id], which is invalid for a Many2one.
  const created=await odooRpc(cfg.baseUrl,'object','execute_kw',[
    cfg.database,uid,cfg.apiKey,'leads.sources','create',
    [{name:sourceName,digital_lead:true,source:'inbound_source'}]
  ]);
  const sourceId=Array.isArray(created)?created[0]:created;
  if(!sourceId || !Number.isFinite(Number(sourceId))) throw new Error('Odoo returned an invalid lead source ID');
  return Number(sourceId);
}
async function odooRpc(baseUrl, service, method, args) {
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),10000);
  try{
    const r=await fetch(String(baseUrl).replace(/\/$/,'')+'/jsonrpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'call',params:{service,method,args},id:Date.now()}),signal:controller.signal});
    const payload=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(`Odoo HTTP ${r.status}`);
    if(payload.error) throw new Error(payload.error?.data?.message||payload.error?.message||'Odoo RPC error');
    return payload.result;
  } finally { clearTimeout(timer); }
}
async function testOdooDirect(cfg) {
  if(!cfg.baseUrl||!cfg.database||!cfg.username||!cfg.apiKey) throw new Error('Odoo URL, database, username and API key are required');
  const uid=await odooRpc(cfg.baseUrl,'common','authenticate',[cfg.database,cfg.username,cfg.apiKey,{}]);
  if(!uid) throw new Error('Odoo authentication failed');
  return { uid };
}
async function syncLeadToCrm(kind,data) {
  const cfg=readIntegrations();
  if(!cfg.enabled||cfg.mode==='disabled') return { attempted:false };
  try{
    if(cfg.mode==='webhook'){
      if(!cfg.webhookUrl) throw new Error('Webhook URL is missing');
      const headers={'Content-Type':'application/json','X-Logic-Lead-Type':kind};
      if(cfg.webhookSecret) headers.Authorization='Bearer '+cfg.webhookSecret;
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),10000);
      let r;
      const crmData={...data,source:crmSourceForLead(kind,data)};
      try{ r=await fetch(cfg.webhookUrl,{method:'POST',headers,body:JSON.stringify({kind,receivedAt:new Date().toISOString(),...crmData}),signal:controller.signal}); }
      finally{ clearTimeout(timer); }
      if(!r.ok) throw new Error(`Webhook returned HTTP ${r.status}`);
      integrationLog({ok:true,mode:'webhook',kind,source:crmData.source,name:data.name||'',phone:data.phone||''});
      return { attempted:true, ok:true };
    }
    if(cfg.mode==='odoo'){
      const {uid}=await testOdooDirect(cfg);
      const model=String(cfg.model||'leads.logic').trim()||'leads.logic';
      const sourceName=crmSourceForLead(kind,data);
      let values;
      if(model==='leads.logic'){
        const sourceId=await ensureOdooLeadSource(cfg,uid,sourceName);
        values={
          name:data.name||data.phone||data.email||'Website Lead',
          phone_number:data.phone||'',
          email_address:data.email||'',
          preferred_course:data.course||'',
          leads_source:sourceId
        };
      }else{
        values={
          name:`Website Lead - ${data.name||data.phone||data.email||'New enquiry'}`,
          contact_name:data.name||'',
          phone:data.phone||'',
          email_from:data.email||'',
          description:compactLeadDescription(kind,{...data,source:sourceName}),
          type:'lead'
        };
      }

      // Validate optional custom mappings against the actual Odoo model schema.
      // This prevents old crm.lead mappings (contact_name/email_from/phone/type)
      // from breaking custom models such as leads.logic.
      if(cfg.customFieldMap){
        let mapping={}; try{mapping=JSON.parse(cfg.customFieldMap)}catch{throw new Error('Custom field mapping JSON is invalid')}
        const mappedData={...data,source:sourceName};
        const fieldInfo=await odooRpc(cfg.baseUrl,'object','execute_kw',[cfg.database,uid,cfg.apiKey,model,'fields_get',[],{'attributes':['type']}]);
        const validFields=new Set(Object.keys(fieldInfo||{}));
        const skipped=[];
        if(mapping && typeof mapping==='object'){
          for(const [odooField,websiteKey] of Object.entries(mapping)){
            if(!odooField||!websiteKey||mappedData[websiteKey]===undefined) continue;
            if(!validFields.has(odooField)){ skipped.push(odooField); continue; }
            // leads.logic.leads_source is a Many2one and is resolved above to one numeric ID.
            // Never let text/legacy custom mapping overwrite that native value.
            if(model==='leads.logic' && odooField==='leads_source'){ skipped.push(odooField); continue; }
            values[odooField]=mappedData[websiteKey];
          }
        }
        if(skipped.length) integrationLog({ok:true,mode:'odoo',kind,note:'Ignored invalid Odoo mapping fields',fields:skipped,model});
      }
      const leadId=await odooRpc(cfg.baseUrl,'object','execute_kw',[cfg.database,uid,cfg.apiKey,model,'create',[values]]);
      integrationLog({ok:true,mode:'odoo',kind,source:sourceName,leadId,name:data.name||'',phone:data.phone||''});
      return { attempted:true,ok:true,leadId };
    }
    return { attempted:false };
  }catch(e){
    integrationLog({ok:false,mode:cfg.mode,kind,error:e.message,name:data.name||'',phone:data.phone||''});
    throw e;
  }
}
function contentTypeFor(file) { return mime[path.extname(file).toLowerCase()] || 'application/octet-stream'; }
function serveFile(res, file, status=200, injectTracking=true) {
  fs.readFile(file, (err, buf) => {
    if (err) { text(res, 404, 'Not found'); return; }
    let body=buf;
    const isHtml=path.extname(file).toLowerCase()==='.html';
    const isAdmin=file.includes(path.sep+'admin'+path.sep);
    if(isHtml&&!isAdmin&&injectTracking){body=Buffer.from(injectTrackingIntoHtml(buf.toString('utf8')),'utf8');}
    res.writeHead(status, {
      'Content-Type': contentTypeFor(file), 'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(body);
  });
}
function safeTextFilePath(p) {
  p = String(p || '').replace(/^\/+/, '').replace(/\\/g,'/');
  const allowed = ['partials/header.html','partials/footer.html','assets/styles.css','assets/site.js','assets/config.js','robots.txt','sitemap.xml'];
  if (!allowed.includes(p)) return null;
  return { rel:p, abs:path.join(ROOT,p) };
}

if (!fs.existsSync(INTEGRATIONS_FILE)) atomicWrite(INTEGRATIONS_FILE, JSON.stringify(integrationDefaults(), null, 2));
if (!fs.existsSync(SETTINGS_FILE)) atomicWrite(SETTINGS_FILE, JSON.stringify({ siteName:'Logic School of Management' }, null, 2));

const legacyHandler = async (req, res) => {
  const parsed = new URL(req.url,'http://localhost');
  const u={query:Object.fromEntries(parsed.searchParams),pathname:parsed.pathname};
  const pathname = decodeURIComponent(u.pathname);

  if(req.method==='GET'&&pathname==='/api/brochure/download')return serveBrochureDownload(res,u.query.token);
  if (pathname.startsWith('/api/admin/')) {
    const session = requireAdmin(req,res); if (!session) return;
    try {
      if (req.method === 'GET' && pathname === '/api/admin/dashboard') {
        const pages=listPages(), media=mediaFiles(), leads=readLeads(), backups=listBackups();
        return json(res,200,{ok:true,stats:{pages:pages.length,media:media.length,leads:leads.length,backups:backups.length},recentLeads:leads.slice(0,5)});
      }
      if (req.method === 'GET' && pathname === '/api/admin/pages') return json(res,200,{ok:true,pages:listPages()});
      if (req.method === 'GET' && pathname === '/api/admin/page') {
        const p=safePagePath(u.query.path); if(!p||!fs.existsSync(p.abs)) return json(res,404,{ok:false,error:'Page not found'});
        return json(res,200,{ok:true,path:p.rel,html:fs.readFileSync(p.abs,'utf8')});
      }
      if (req.method === 'POST' && pathname === '/api/admin/page/create') {
        const data=await readJson(req,1024*1024); const p=safePagePath(data.path);
        if(!p) return json(res,400,{ok:false,error:'Use a valid .html page path'});
        if(fs.existsSync(p.abs)) return json(res,409,{ok:false,error:'A page with that path already exists'});
        let html='';
        if(data.from){const src=safePagePath(data.from);if(!src||!fs.existsSync(src.abs))return json(res,404,{ok:false,error:'Source page not found'});html=fs.readFileSync(src.abs,'utf8');}
        else {const depth=p.rel.split('/').length-1, pre='../'.repeat(depth);html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${String(data.title||'New Page').replace(/[<>]/g,'')}</title><link rel="stylesheet" href="${pre}assets/styles.css"><script>window.LOGIC_ROOT='${pre}'</script><script defer src="${pre}assets/config.js"></script><script defer src="${pre}assets/site.js"></script></head><body><!-- SHARED:header --><main><section class="page-hero"><div class="container"><span class="eyebrow">NEW PAGE</span><h1>${String(data.title||'New Page').replace(/[<>]/g,'')}</h1><p>Edit this page from the Logic CMS visual editor.</p></div></section></main><!-- SHARED:footer --></body></html>`;}
        if(data.title) html=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${String(data.title).replace(/[<>]/g,'')}</title>`);
        fs.mkdirSync(path.dirname(p.abs),{recursive:true});atomicWrite(p.abs,html);return json(res,200,{ok:true,path:p.rel});
      }
      if (req.method === 'DELETE' && pathname === '/api/admin/page') {
        const p=safePagePath(u.query.path);if(!p||!fs.existsSync(p.abs))return json(res,404,{ok:false,error:'Page not found'});
        if(p.rel==='index.html')return json(res,400,{ok:false,error:'The homepage cannot be deleted'});
        backupPage(p.rel,fs.readFileSync(p.abs,'utf8'));fs.unlinkSync(p.abs);return json(res,200,{ok:true});
      }
      if (req.method === 'PUT' && pathname === '/api/admin/page') {
        const p=safePagePath(u.query.path); if(!p||!fs.existsSync(p.abs)) return json(res,404,{ok:false,error:'Page not found'});
        const data=await readJson(req,MAX_JSON); if(typeof data.html!=='string'||!data.html.toLowerCase().includes('<html')) return json(res,400,{ok:false,error:'Valid full HTML is required'});
        const old=fs.readFileSync(p.abs,'utf8'); backupPage(p.rel,old); atomicWrite(p.abs,renderService.normalize(data.html)); return json(res,200,{ok:true,backupCreated:true});
      }
      if (req.method === 'GET' && pathname === '/api/admin/brochures') return json(res,200,{ok:true,files:brochureFiles(),brochures:safeReadJson(SETTINGS_FILE,{}).brochures||{}});
      if (req.method === 'POST' && pathname === '/api/admin/brochure/upload') {
        const data=await readJson(req,MAX_JSON);
        const m=String(data.data||'').match(/^data:application\/pdf;base64,(.+)$/i); if(!m) return json(res,400,{ok:false,error:'Please upload a PDF brochure'});
        const buf=Buffer.from(m[1],'base64'); if(buf.subarray(0,5).toString()!=='%PDF-')return json(res,400,{ok:false,error:'Invalid PDF'}); if(buf.length>MAX_BROCHURE) return json(res,413,{ok:false,error:'Brochure exceeds 30 MB'});
        let name=String(data.name||'brochure.pdf'); if(path.extname(name).toLowerCase()!=='.pdf') name+='.pdf';
        name=sanitizeFilename(name); const abs=path.join(BROCHURE_DIR,name); fs.writeFileSync(abs,buf);
        return json(res,200,{ok:true,file:{name,url:'/uploads/brochures/'+encodeURIComponent(name),bytes:buf.length,modified:new Date().toISOString()}});
      }
      if (req.method === 'DELETE' && pathname === '/api/admin/brochure') {
        const target=String(u.query.url||''); if(!target.startsWith('/uploads/brochures/')) return json(res,400,{ok:false,error:'Invalid brochure URL'});
        const abs=path.join(BROCHURE_DIR,path.basename(target)); if(!fs.existsSync(abs)) return json(res,404,{ok:false,error:'Brochure not found'});
        fs.unlinkSync(abs); return json(res,200,{ok:true});
      }
      if (req.method === 'GET' && pathname === '/api/admin/integrations') return json(res,200,{ok:true,integration:adminIntegrationView(),logs:readIntegrationLog()});
      if (req.method === 'PUT' && pathname === '/api/admin/integrations') {
        const data=await readJson(req,1024*1024), current=readIntegrations();
        const next={...current};
        for(const k of ['enabled','mode','baseUrl','database','username','model','customFieldMap','webhookUrl']) if(k in data) next[k]=data[k];
        if(String(data.apiKey||'').trim()) next.apiKey=String(data.apiKey).trim();
        if(data.clearApiKey===true) next.apiKey='';
        if(String(data.webhookSecret||'').trim()) next.webhookSecret=String(data.webhookSecret).trim();
        if(data.clearWebhookSecret===true) next.webhookSecret='';
        if(!['disabled','odoo','webhook'].includes(next.mode)) next.mode='disabled';
        next.enabled=!!next.enabled && next.mode!=='disabled';
        atomicWrite(INTEGRATIONS_FILE,JSON.stringify(next,null,2)); return json(res,200,{ok:true,integration:adminIntegrationView()});
      }
      if (req.method === 'POST' && pathname === '/api/admin/integrations/test') {
        const cfg=readIntegrations();
        if(cfg.mode==='odoo'){const result=await testOdooDirect(cfg);return json(res,200,{ok:true,message:`Odoo authenticated successfully (user ID ${result.uid}).`});}
        if(cfg.mode==='webhook'){
          if(!cfg.webhookUrl) return json(res,400,{ok:false,error:'Webhook URL is missing'});
          const headers={'Content-Type':'application/json','X-Logic-Connection-Test':'1'}; if(cfg.webhookSecret)headers.Authorization='Bearer '+cfg.webhookSecret;
          const r=await fetch(cfg.webhookUrl,{method:'POST',headers,body:JSON.stringify({event:'logic_connection_test',test:true,at:new Date().toISOString()})});
          if(!r.ok) return json(res,400,{ok:false,error:`Webhook returned HTTP ${r.status}`});
          return json(res,200,{ok:true,message:'Webhook accepted the connection test.'});
        }
        return json(res,400,{ok:false,error:'Choose and enable an integration mode first'});
      }
      if (req.method === 'GET' && pathname === '/api/admin/media') return json(res,200,{ok:true,media:mediaFiles()});
      if (req.method === 'DELETE' && pathname === '/api/admin/media') {
        const target=String(u.query.url||'');
        let abs=null; if(target.startsWith('/uploads/')) abs=path.join(UPLOAD_DIR,path.basename(target)); else if(target.startsWith('/assets/images/')) abs=path.join(ROOT,'assets','images',path.basename(target));
        if(!abs||!fs.existsSync(abs)) return json(res,404,{ok:false,error:'Media not found'});
        fs.unlinkSync(abs); return json(res,200,{ok:true});
      }
      if (req.method === 'GET' && pathname === '/api/admin/backups') return json(res,200,{ok:true,backups:listBackups()});
      if (req.method === 'POST' && pathname === '/api/admin/restore-backup') {
        const data=await readJson(req,100*1024); const name=path.basename(String(data.name||'')); const backup=path.join(BACKUP_DIR,name);
        if(!fs.existsSync(backup)) return json(res,404,{ok:false,error:'Backup not found'});
        const encoded=name.split('__').slice(1).join('__');
        if(encoded.startsWith('FILE__')){const rel=encoded.slice(6).replace(/__/g,'/');const p=safeTextFilePath(rel);if(!p)return json(res,400,{ok:false,error:'Invalid file backup'});atomicWrite(p.abs,fs.readFileSync(backup,'utf8'));return json(res,200,{ok:true,file:p.rel});}
        const rel=encoded.replace(/__/g,'/'); const p=safePagePath(rel); if(!p) return json(res,400,{ok:false,error:'Invalid backup'});
        if(fs.existsSync(p.abs)) backupPage(p.rel,fs.readFileSync(p.abs,'utf8'));
        atomicWrite(p.abs,fs.readFileSync(backup,'utf8')); return json(res,200,{ok:true,path:p.rel});
      }
      if (req.method === 'GET' && pathname === '/api/admin/file') {
        const p=safeTextFilePath(u.query.path); if(!p||!fs.existsSync(p.abs)) return json(res,404,{ok:false,error:'File not found'});
        return json(res,200,{ok:true,path:p.rel,content:fs.readFileSync(p.abs,'utf8')});
      }
      if (req.method === 'PUT' && pathname === '/api/admin/file') {
        const p=safeTextFilePath(u.query.path); if(!p||!fs.existsSync(p.abs)) return json(res,404,{ok:false,error:'File not found'});
        const data=await readJson(req,MAX_JSON); if(typeof data.content!=='string') return json(res,400,{ok:false,error:'Text content required'});
        const backupName=`${new Date().toISOString().replace(/[:.]/g,'-')}__FILE__${p.rel.replace(/[\\/]/g,'__')}`;
        fs.writeFileSync(path.join(BACKUP_DIR,backupName),fs.readFileSync(p.abs)); atomicWrite(p.abs,data.content); return json(res,200,{ok:true});
      }
      return json(res,404,{ok:false,error:'Admin API route not found'});
    } catch (e) {
      console.error(e); return json(res,500,{ok:false,error:e.message||'Server error'});
    }
  }

  return json(res,404,{ok:false,error:'Route not found'});
};
module.exports={legacyHandler,injectTrackingIntoHtml,crmSourceForLead,syncLeadToCrm,brochureConfigForKind,createBrochureDownloadToken,publicBrochureView,setSettings:s=>{databaseSettings=s;}};
if(require.main===module)require('./server/app').start();
