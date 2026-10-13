'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),cp=require('child_process');
const root=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-retention-race-'))),children=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function spawn(code,args){const p=cp.spawn(process.execPath,['-e',code,...args],{stdio:['ignore','pipe','pipe']});children.push(p);let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);const done=new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',status=>resolve({status,out,err}));});return {p,done};}
(async()=>{let timer;try{
 const file=path.join(root,'CLAUDE.md'),receipt=path.join(root,'receipt.json'),signal=path.join(root,'reserved'),go=path.join(root,'go');fs.writeFileSync(file,'RECOVERY');fs.writeFileSync(receipt,'{}',{mode:0o600});
 const source=require.resolve('../lib/backup');
 const one=spawn(`const fs=require('fs'),B=require(process.argv[1]);const link=fs.linkSync;fs.linkSync=(a,b)=>{fs.writeFileSync(process.argv[5],'ready');const deadline=Date.now()+4000;while(!fs.existsSync(process.argv[6])){if(Date.now()>deadline)throw Error('barrier timeout');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}return link(a,b);};process.stdout.write(JSON.stringify(B.save({home:process.argv[2],file:process.argv[3],reference:{owner:'wait-rules',operation:'b'.repeat(32),receipt:process.argv[4]}})));`,[source,root,file,receipt,signal,go]);
 const deadline=Date.now()+4000;while(!fs.existsSync(signal)){if(Date.now()>deadline)throw Error('reserve barrier absent');await pause(10);}
 const two=spawn(`const B=require(process.argv[1]);for(let i=0;i<20;i++)B.save({home:process.argv[2],file:process.argv[3]});`,[source,root,file]);
 await pause(100);assert.equal(two.p.exitCode,null,'ordinary writer bypassed active directory lock');fs.writeFileSync(go,'go');
 const runs=await Promise.race([Promise.all([one.done,two.done]),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('process deadline')),8000);})]);
 for(const r of runs)assert.equal(r.status,0,r.err);const saved=JSON.parse(runs[0].out);assert.equal(fs.readFileSync(saved.path,'utf8'),'RECOVERY');assert.ok(fs.existsSync(saved.reference.file));
 console.log('PASS: backup retention process — 1 case');
}catch(e){console.error('FAIL '+e.stack);process.exitCode=1;}finally{clearTimeout(timer);for(const p of children)if(p.exitCode===null)p.kill('SIGKILL');await Promise.all(children.map(p=>p.exitCode!==null?Promise.resolve():new Promise(r=>p.once('close',r))));fs.rmSync(root,{recursive:true,force:true});}})();
