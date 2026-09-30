'use strict';
// Run from the extracted 7.1 package. Only the reviewed code manifest is copied.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),readline=require('readline/promises');
const source=path.resolve(__dirname,'..'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function main(){
 const args=process.argv.slice(2),check=args.includes('--check');let target=args.find(a=>a!=='--check');
 if(!target){const rl=readline.createInterface({input:process.stdin,output:process.stdout});try{target=await rl.question('Stop the old server first. Paste your existing Logic-CMS-7 folder path: ');}finally{rl.close();}}
 target=path.resolve(String(target||'').trim().replace(/^"|"$/g,''));
 if(target===source)throw Error('Choose your EXISTING CMS 7 folder, not this extracted update folder.');
 const pkg=JSON.parse(fs.readFileSync(path.join(target,'package.json'),'utf8'));
 if(pkg.name!=='logic-school-website'||!/^7\.(0|1)\./.test(pkg.version))throw Error('This update is for an existing Logic CMS 7.0 or 7.1 project.');
 const manifest=JSON.parse(fs.readFileSync(path.join(source,'update-manifest.json'),'utf8')),pending=[],conflicts=[];
 for(const entry of manifest.files){
  const rel=entry.path;
  if(!/^[\w./-]+$/.test(rel)||rel.includes('..')||/^(data|uploads|node_modules)(\/|$)/.test(rel)||rel.startsWith('.')||(!rel.includes('/')&&rel.endsWith('.html')))throw Error('Invalid update path: '+rel);
  const src=path.join(source,rel),dest=path.join(target,rel);if(hash(src)!==entry.sha256)throw Error('Update package file differs from manifest: '+rel);
  if(fs.existsSync(dest)){const current=hash(dest);if(current===entry.sha256)continue;if(![entry.previousSha256,...(entry.previousSha256s||[])].includes(current)){conflicts.push(rel);continue;}}
  pending.push({rel,src,dest,existed:fs.existsSync(dest)});
 }
 if(conflicts.length)throw Error('Your copy has different edits in these code files. Nothing was changed. Keep those edits and merge the update before continuing:\n'+conflicts.join('\n'));
 if(check){console.log('Preflight passed. '+pending.length+' files would be updated. No files changed.');return;}
 if(!pending.length){console.log('This update is already installed. Run npm run migrate, then npm start in your existing folder.');return;}
 const backup=path.join(target,'data','backups','cms-7.1.2-update-'+new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(backup,{recursive:true});
 // Complete backups before writing any application file.
 for(const p of pending)if(p.existed){const saved=path.join(backup,p.rel);fs.mkdirSync(path.dirname(saved),{recursive:true});fs.copyFileSync(p.dest,saved);}
 fs.writeFileSync(path.join(backup,'restore-list.json'),JSON.stringify(pending.map(p=>({path:p.rel,previouslyExisted:p.existed})),null,2));
 try{for(const p of pending){fs.mkdirSync(path.dirname(p.dest),{recursive:true});fs.copyFileSync(p.src,p.dest);}}
 catch(e){for(const p of pending){if(p.existed)fs.copyFileSync(path.join(backup,p.rel),p.dest);else fs.rmSync(p.dest,{force:true});}throw Error('Update failed; previous application files restored. '+e.message);}
 console.log('Updated '+pending.length+' code/documentation files.');console.log('Previous code backup: '+backup);console.log('Your .env, database, account, uploads, settings, public pages and shared partials were kept.');console.log('In your EXISTING folder, run:\n  npm run migrate\n  npm start\nThen sign in with your existing account.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
