require('dotenv').config({quiet:true});const {connect}=require('../server/services/db');const {seed}=require('../server/services/seed');
(async()=>{const db=await connect();await db.migrate();await seed(db);await db.close();console.log('Migration and one-time content import complete.');})().catch(e=>{console.error(e.message);process.exitCode=1});
