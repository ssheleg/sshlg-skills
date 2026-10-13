'use strict';
// Actual frozen backup module, synthetic HOME only. Reproduces aliasing under
// default KEEP=10; this is a defect witness, not a passing implementation test.
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),Module=require('module'),crypto=require('crypto');
const sourceCommit='bca35fb74e05ca4fafba594ca317664285fe8636';
const source=cp.execFileSync('git',['show',sourceCommit+':lib/backup.js'],{encoding:'utf8'});
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.json'),'utf8'));
const expected=manifest.sources.find(r=>r.repo==='ssheleg/sshlg-skills'&&r.path==='lib/backup.js');
if(crypto.createHash('sha256').update(source).digest('hex')!==expected.sha256)throw Error('frozen source hash mismatch');
const m=new Module(path.join(__dirname,'frozen-backup.js'));m.filename=path.join(__dirname,'frozen-backup.js');m.paths=module.paths;m._compile(source,m.filename);
const B=m.exports,home=fs.mkdtempSync(path.join(os.tmpdir(),'b174-backup-collision-'));
try{
 const a=path.join(home,'profiles','a','CLAUDE.md'),b=path.join(home,'profiles_a','CLAUDE.md');
 fs.mkdirSync(path.dirname(a),{recursive:true});fs.mkdirSync(path.dirname(b),{recursive:true});
 fs.writeFileSync(a,'FIRST_PROFILE_FIXTURE\n');fs.writeFileSync(b,'SECOND_PROFILE_FIXTURE\n');
 const first=B.save({home,file:a,stamp:'20261013T000000Z'});
 let pruned=[];
 for(let i=1;i<=10;i++){
  const result=B.save({home,file:b,stamp:'20261013T0000'+String(i).padStart(2,'0')+'Z'});
  pruned.push(...result.pruned);
 }
 const r={schema:'b174-backup-defect/1',verdict:'REPRODUCED',sourceCommit,sourceSha256:expected.sha256,defaultKeep:B.KEEP,
  targetAliases:['~/profiles/a/CLAUDE.md','~/profiles_a/CLAUDE.md'],keys:[B.keyFor(a,home),B.keyFor(b,home)],
  sameKey:B.keyFor(a,home)===B.keyFor(b,home),firstBackupSurvives:fs.existsSync(first.path),
  secondTargetHistoryPrunedFirst:pruned.includes(path.basename(first.path)),
  latestForFirstReturnsSecondBytes:fs.readFileSync(B.latest({home,file:a})).equals(fs.readFileSync(b)),
  targetBytesUnchanged:fs.readFileSync(a,'utf8')==='FIRST_PROFILE_FIXTURE\n'&&fs.readFileSync(b,'utf8')==='SECOND_PROFILE_FIXTURE\n',
  scope:'Synthetic profile roots; no real-home apply, restore or migration. Frozen old source only.'};
 if(!r.sameKey||r.firstBackupSurvives||!r.secondTargetHistoryPrunedFirst||!r.latestForFirstReturnsSecondBytes||!r.targetBytesUnchanged)throw Error('expected frozen defect not reproduced');
 console.log(JSON.stringify(r,null,2));
}finally{fs.rmSync(home,{recursive:true,force:true});}
