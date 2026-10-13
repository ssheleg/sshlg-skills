'use strict';
// Observation only. Pass the exact reviewed lib/backup.js path; no host writes.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
if(process.argv.length!==3)throw Error('usage: node reproduce-retention.js /absolute/path/to/lib/backup.js');
const B=require(path.resolve(process.argv[2]));
const home=fs.mkdtempSync(path.join(os.tmpdir(),'mb02-retention-observation-'));
try{
 const file=path.join(home,'CLAUDE.md');fs.writeFileSync(file,'RECOVERY');
 const recovery=B.save({home,file,keep:Infinity,stamp:'20261013T000000Z'});
 assert.equal(recovery.action,'saved');
 for(let i=1;i<=11;i++){fs.writeFileSync(file,String(i));B.save({home,file,stamp:'20261013T0000'+String(i).padStart(2,'0')+'Z'});}
 console.log(JSON.stringify({schema:'mb02-retention-observation/1',recoveryCopyStillExists:fs.existsSync(recovery.path),laterOrdinarySaves:11,scope:'same target and backup directory; synthetic only'},null,2));
}finally{fs.rmSync(home,{recursive:true,force:true});}
