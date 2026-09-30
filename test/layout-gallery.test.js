const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto');
test('global layout and poster publishing keep shared settings, URLs and category isolation',async()=>{
 Object.assign(process.env,{NODE_ENV:'development',DEV_DATABASE:'pglite',DEV_DATABASE_DIR:fs.mkdtempSync(path.join(os.tmpdir(),'logic-gallery-')),SESSION_SECRET:crypto.randomBytes(32).toString('hex'),TOTP_ENCRYPTION_KEY:crypto.randomBytes(32).toString('hex'),PORT:'0'});delete process.env.DATABASE_URL;delete process.env.PUBLIC_ORIGIN;
 const {server,db}=await require('../server/app').start(),base='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 async function call(p,method='GET',body){const r=await fetch(base+p,{method,headers:{Cookie:cookie,'Content-Type':'application/json','X-CSRF-Token':csrf},...(body?{body:JSON.stringify(body)}:{})});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d=raw}if(d.csrfToken)csrf=d.csrfToken;return {r,d};}
 try{
 const password=crypto.randomBytes(20).toString('hex');await db.query('INSERT INTO admin_users(username,password_hash) VALUES($1,$2)',['gallery',await require('bcryptjs').hash(password,4)]);
 assert.equal((await call('/api/admin/layout/footer')).r.status,401);await call('/api/admin/session');await call('/api/admin/login','POST',{username:'gallery',password});
 const original=(await call('/api/admin/settings')).d.settings;
 assert.equal((await call('/api/admin/layout/header','PUT',{settings:{navigation:[{label:'Our courses',url:'/courses/index.html'}]},layout:{applyText:'Book a visit',applyUrl:'/contact.html',moreLinks:[]}})).r.status,200);
 assert.equal((await call('/api/admin/layout/footer','PUT',{settings:{tagline:'Global footer QA'},layout:{contactTitle:'Admissions team',quickLinks:[{label:'View results',url:'/results.html'}],copyright:'QA copyright'}})).r.status,200);
 for(const route of ['/','/courses/ca.html','/blog/ca-foundation-roadmap.html','/results/ca.html','/placements.html']){const h=(await call(route)).d;assert.match(h,/Book a visit/);assert.match(h,/Global footer QA/);assert.match(h,/Admissions team/);assert.match(h,/View results/);assert.ok(!h.includes('nav-more-button'));}
 const settings=(await call('/api/admin/settings')).d.settings;assert.deepEqual(settings.tracking,original.tracking);assert.deepEqual(settings.brochures,original.brochures);assert.equal(settings.header.applyText,'Book a visit');assert.match((await call('/branches.html')).d,/73564 66111/);
 const image='/assets/images/result-poster-1.svg';
 async function put(t,id,d){const x=await call('/api/admin/content/'+t+'/'+id,'PUT',d);assert.equal(x.r.status,200,JSON.stringify(x.d));}
 await put('results','gallery-qa',{categoryId:'ca',title:'QA course-only poster',image,level:'CA Foundation',status:'published'});
 assert.match((await call('/results/ca.html')).d,/QA course-only poster/);assert.ok(!(await call('/results.html')).d.includes('QA course-only poster'));assert.ok(!(await call('/results/cma-usa.html')).d.includes('QA course-only poster'));
 await put('results','gallery-draft',{categoryId:'ca',title:'QA hidden result',image,status:'draft'});assert.ok(!(await call('/results/ca.html')).d.includes('QA hidden result'));assert.equal((await call('/api/public/content/results')).d.items.length,1);
 await put('placement_posters','placement-qa',{title:'QA placement',company:'QA Company',image,status:'published'});assert.match((await call('/placements.html')).d,/QA placement/);
 for(const [id,page,categoryId,title]of [['listing','results','','QA listing banner'],['course','results','ca','QA CA banner'],['placement','placements','','QA placement banner']])await put('banners',id,{page,categoryId,title,image,status:'published'});
 assert.match((await call('/results.html')).d,/QA listing banner/);assert.ok(!(await call('/results.html')).d.includes('QA CA banner'));assert.match((await call('/results/ca.html')).d,/QA CA banner/);assert.ok(!(await call('/results/cma-usa.html')).d.includes('QA CA banner'));assert.match((await call('/placements.html')).d,/QA placement banner/);
 await put('banners','hidden',{page:'results',title:'QA draft banner',image,status:'draft'});assert.ok(!(await call('/results.html')).d.includes('QA draft banner'));assert.equal((await call('/api/admin/content/result_categories/ca','DELETE')).r.status,409);
 const normalized=require('../server/services/render').normalize((await call('/placements.html')).d);assert.ok(!normalized.includes('data-gallery-managed'));assert.ok(!normalized.includes('QA placement'));
 await call('/api/admin/content/placement_posters/placement-qa','DELETE');assert.ok(!(await call('/placements.html')).d.includes('data-placement-id="placement-qa"'));
 await call('/api/admin/content/banners/course','DELETE');assert.ok(!(await call('/results/ca.html')).d.includes('QA CA banner'));
 await db.migrate();assert.equal((await db.get('global_settings','site')).footer.contactTitle,'Admissions team');assert.equal((await db.get('results','gallery-qa')).title,'QA course-only poster');
 console.log('Global layout, draft/publish/delete, banner placement, category isolation and repeat migration passed.');
 }finally{await new Promise(r=>server.close(r));await db.close();fs.rmSync(process.env.DEV_DATABASE_DIR,{recursive:true,force:true});}
});
