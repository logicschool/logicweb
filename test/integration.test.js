const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('crypto'),fs=require('fs'),os=require('os'),path=require('path'),bcrypt=require('bcryptjs'),OTP=require('otpauth');
test('database, CMS, forms, sessions, uploads and TOTP integration',async()=>{process.env.NODE_ENV='development';process.env.DEV_DATABASE='pglite';process.env.DEV_DATABASE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'logic-test-'));process.env.SESSION_SECRET=crypto.randomBytes(32).toString('hex');process.env.TOTP_ENCRYPTION_KEY=crypto.randomBytes(32).toString('hex');process.env.PORT='0';delete process.env.PUBLIC_ORIGIN;delete process.env.DATABASE_URL;
 const {start}=require('../server/app');const {server,db}=await start();const base='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';const password=crypto.randomBytes(16).toString('hex');
 async function call(p,method='GET',body,extra={}){const r=await fetch(base+p,{method,headers:{'Content-Type':'application/json',Cookie:cookie,...(csrf?{'X-CSRF-Token':csrf}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];const text=await r.text();let d;try{d=JSON.parse(text)}catch{d=text}if(d.csrfToken)csrf=d.csrfToken;return {r,d};}
 try{
 await db.query('INSERT INTO admin_users(username,password_hash) VALUES($1,$2)',['qa',await bcrypt.hash(password,4)]);
 let x=await call('/');assert.equal(x.r.status,200);assert.match(x.d,/data-shared="header"/);assert.match(x.d,/data-record-id="ca"/);assert.ok(!x.d.includes('🏛'));
 for(const p of ['/data/site-settings.json','/.git/config','/.env','/server/app.js','/package-lock.json','/partials/header.html'])assert.notEqual((await call(p)).r.status,200,p);
 assert.equal((await call('/api/admin/content/blog_posts')).r.status,401);
 x=await call('/api/admin/session');assert.equal(x.d.authenticated,false);
 x=await call('/api/admin/login','POST',{username:'qa',password});assert.equal(x.r.status,200);assert.match(cookie,/logic_admin_session=/);
 x=await call('/api/admin/settings','PUT',{phone:'+91 12345 67890'},{'X-CSRF-Token':''});assert.equal(x.r.status,403);
 x=await call('/api/admin/settings','PUT',{phone:'+91 12345 67890'});assert.equal(x.r.status,200);
 x=await call('/api/public/settings');assert.equal(x.d.settings.phone,'+91 12345 67890');assert.equal(x.d.settings.brochures,undefined);
 x=await call('/api/admin/content/blog_posts/qa-test','PUT',{title:'QA Article',slug:'qa-test',status:'draft',content:'<p>Good</p><script>alert(1)</script>',category:'india'});assert.equal(x.r.status,200);
 assert.equal((await call('/blog/qa-test.html')).r.status,404);
 x=await call('/api/admin/content/blog_posts/qa-test','PUT',{title:'QA Article',slug:'qa-test',status:'published',content:'<p>Good</p><script>alert(1)</script>',category:'india'});assert.equal(x.r.status,200);
 x=await call('/blog/qa-test.html');assert.equal(x.r.status,200);assert.match(x.d,/<p>Good<\/p>/);assert.ok(!x.d.includes('alert(1)'));
 x=await call('/api/admin/content/results/qa-result','PUT',{categoryId:'ca',title:'QA result',level:'CA Foundation',image:'/assets/images/result-poster-1.svg',year:'2026'});assert.equal(x.r.status,200);x=await call('/results/ca.html');assert.match(x.d,/CA Foundation/);assert.match(x.d,/data-image-lightbox/);
 x=await call('/api/admin/media/upload','POST',{name:'bad.html',data:'data:image/png;base64,aGVsbG8='});assert.equal(x.r.status,400);
 const png=await require('sharp')({create:{width:10,height:10,channels:3,background:'#11522c'}}).png().toBuffer();x=await call('/api/admin/media/upload','POST',{name:'qa.png',data:'data:image/png;base64,'+png.toString('base64')});assert.equal(x.r.status,200);const uploaded=x.d.file.url;assert.equal((await call(uploaded)).r.status,200);await call('/api/admin/media?url='+encodeURIComponent(uploaded),'DELETE');
 x=await call('/api/newsletter','POST',{email:'invalid'});assert.equal(x.r.status,400);
 x=await call('/api/newsletter','POST',{email:'qa@example.invalid'});assert.equal(x.r.status,200);assert.equal(x.d.duplicate,false);x=await call('/api/newsletter','POST',{email:'qa@example.invalid'});assert.equal(x.d.duplicate,true);
 x=await call('/api/enquiry','POST',{name:'QA',phone:'1234567890',website:'spam'});assert.equal(x.r.status,400);
 // Verify all existing lead routing families and gated PDF downloads without contacting a live CRM.
 for(const [endpoint,formType,source] of [['enquiry','Callback','Website Enquiry'],['contact','','Website Contact'],['enquiry','Career Test','Website Career Test'],['enquiry','Placement Assistance','Website Placement Assistance']]){
 x=await call('/api/'+endpoint,'POST',{name:'QA form',phone:'1234567890',formType,page:'/qa-'+formType});assert.equal(x.r.status,200);
 const rows=(await call('/api/admin/leads')).d.leads;assert.ok(rows.some(l=>l.source===source));}
 const pdfPath=path.join(__dirname,'../uploads/brochures/qa-test.pdf');fs.writeFileSync(pdfPath,'%PDF-1.4\nQA only');
 try{await call('/api/admin/settings','PUT',{brochures:{master:{enabled:true,label:'QA brochure',url:'/uploads/brochures/qa-test.pdf'}}});x=await call('/api/brochure/request','POST',{kind:'master',name:'QA Brochure',phone:'1234567890'});assert.equal(x.r.status,200);assert.equal((await call('/'+x.d.downloadUrl)).r.status,200);assert.equal((await call('/uploads/brochures/qa-test.pdf')).r.status,403);}finally{fs.unlinkSync(pdfPath);}
 x=await call('/branches.html');assert.match(x.d,/73564 66111/);assert.ok(!x.d.includes('data-global-phone="" href="tel:+917356466111"'));
 const file=path.join(__dirname,'../index.html'),original=fs.readFileSync(file,'utf8');try{let html=(await call('/')).d;const $=require('cheerio').load(html);$('[data-record-id="ca"] h3').text('CA Quality Check');x=await call('/api/admin/page?path=index.html','PUT',{html:$.html()});assert.equal(x.r.status,200);assert.match(fs.readFileSync(file,'utf8'),/CONTENT:programs/);assert.match((await call('/')).d,/CA Quality Check/);}finally{fs.writeFileSync(file,original);}
 x=await call('/api/admin/2fa/setup','POST',{password});assert.equal(x.r.status,200);assert.match(x.d.qr,/^data:image\/png/);const secret=x.d.secret;const otp=new OTP.TOTP({secret:OTP.Secret.fromBase32(secret)}).generate();x=await call('/api/admin/2fa/enable','POST',{otp});assert.equal(x.r.status,200);assert.equal(x.d.recoveryCodes.length,10);const codes=x.d.recoveryCodes;
 await call('/api/admin/logout','POST',{});assert.equal((await call('/api/admin/login','POST',{username:'qa',password})).r.status,401);
 x=await call('/api/admin/login','POST',{username:'qa',password,otp:codes[0]});assert.equal(x.r.status,200);await call('/api/admin/logout','POST',{});assert.equal((await call('/api/admin/login','POST',{username:'qa',password,otp:codes[0]})).r.status,401);
 await call('/api/admin/login','POST',{username:'qa',password,otp:codes[1]});x=await call('/api/admin/2fa/disable','POST',{password,otp:codes[2]});assert.equal(x.r.status,200);
 console.log('Verified auth, CSRF, draft visibility, content sanitization, dynamic results, media validation, newsletter deduplication, 2FA and recovery-code reuse prevention.');
 }finally{await new Promise(r=>server.close(r));await db.close();fs.rmSync(process.env.DEV_DATABASE_DIR,{recursive:true,force:true});}
});
