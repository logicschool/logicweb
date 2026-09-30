const fs=require('fs'),path=require('path'),crypto=require('crypto'),cheerio=require('cheerio');const {root}=require('./db');
async function seed(db){
 if(!await db.get('global_settings','site'))await db.put('global_settings','site',JSON.parse(fs.readFileSync(path.join(root,'data/site-settings.json'),'utf8')));
 if(!await db.get('global_settings','import-v1')){
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/content-seed.json'),'utf8'));
 for(const [table,rows]of Object.entries(data))for(const d of rows)await db.put(table,d.id,d);
 const $=cheerio.load(fs.readFileSync(path.join(root,'branches.html'),'utf8'));
 $('.branch-card,.office-card').each((i,e)=>{$(e).attr('data-branch-id','branch-'+(i+1));});
 const nodes=$('.branch-card,.office-card').toArray();for(let i=0;i<nodes.length;i++){const n=$(nodes[i]);await db.put('branches','branch-'+(i+1),{name:n.find('h3,h2').first().text(),phone:n.find('a[href^="tel:"]').first().text(),order:i});}
 fs.writeFileSync(path.join(root,'branches.html'),$.html());
 const leads=path.join(root,'data/leads.ndjson');if(fs.existsSync(leads))for(const line of fs.readFileSync(leads,'utf8').split('\n').filter(Boolean)){let d;try{d=JSON.parse(line)}catch{continue}await db.query('INSERT INTO contact_submissions(id,kind,data,dedup_key,crm_status) VALUES($1,$2,$3,$4,$5)',[crypto.randomUUID(),d.kind||'imported',JSON.stringify(d),crypto.createHash('sha256').update(line).digest('hex'),'imported']);}
 const dirs=['uploads','assets/images','assets/course-icons'];
 for(const dir of dirs){const scan=async p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory()){if(e.name!=='brochures')await scan(f);continue;}const ext=path.extname(f).toLowerCase(),types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.gif':'image/gif','.ico':'image/x-icon'};if(!types[ext])continue;await db.query('INSERT INTO media_files(id,url,name,mime_type,bytes) VALUES($1,$2,$3,$4,$5) ON CONFLICT(url) DO NOTHING',[crypto.randomUUID(),'/'+path.relative(root,f).split(path.sep).join('/'),e.name,types[ext],fs.statSync(f).size]);}};await scan(path.join(root,dir));}
 await db.put('global_settings','import-v1',{done:true});
 }
}
module.exports={seed};
