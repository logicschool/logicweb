const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const tables=new Set(['global_settings','blog_posts','result_categories','results','programs','branches','placement_posters','banners']);
async function connect(){
 let db;
 if(process.env.DATABASE_URL){const {Pool}=require('pg');db=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='true'?{rejectUnauthorized:true}:undefined,max:10});}
 else if(process.env.NODE_ENV!=='production'&&process.env.DEV_DATABASE==='pglite'){const {PGlite}=require('@electric-sql/pglite');db=new PGlite(process.env.DEV_DATABASE_DIR||path.join(root,'data/dev-db'));}
 else throw new Error('DATABASE_URL is required. Local preview only: DEV_DATABASE=pglite');
 const query=(sql,args)=>db.query(sql,args);
 return {raw:db,query,async migrate(){for(const file of fs.readdirSync(path.join(root,'server/migrations')).filter(x=>x.endsWith('.sql')).sort()){const sql=fs.readFileSync(path.join(root,'server/migrations',file),'utf8');if(db.exec)await db.exec(sql);else await query(sql);}},async list(table){if(!tables.has(table))throw Error('Invalid table');return (await query(`SELECT id,data FROM ${table} ORDER BY COALESCE((data->>'order')::numeric,0),id`)).rows.map(x=>({...x.data,id:x.id}));},async get(table,id){if(!tables.has(table))throw Error('Invalid table');return (await query(`SELECT data FROM ${table} WHERE id=$1`,[id])).rows[0]?.data;},async put(table,id,data){if(!tables.has(table))throw Error('Invalid table');await query(`INSERT INTO ${table}(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2,updated_at=now()`,[id,JSON.stringify(data)]);return data;},async remove(table,id){if(!tables.has(table))throw Error('Invalid table');await query(`DELETE FROM ${table} WHERE id=$1`,[id]);},async close(){await (db.end?db.end():db.close());}};
}
module.exports={connect,root};
