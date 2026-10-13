'use strict';
const root=process.argv[2]||require('path').resolve(__dirname,'../../../..');
const fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto');
const W=require(root+'/lib/wait-rules'),P=require(root+'/lib/wait-rule-policy'),A=require(root+'/lib/apply');
const h=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'mb02b-root-delta-')));
const opts=a=>({env:{},cursor:false,hostTargets:A.TARGETS.filter(t=>t.agent===a)});
try{
 for(const a of ['claude','codex'])fs.mkdirSync(path.join(h,'.'+a));
 P.set(h,'on');const cf=path.join(h,'.claude','CLAUDE.md'),f=path.join(h,'.codex','AGENTS.md');fs.writeFileSync(cf,'CLAUDE ORIGINAL');fs.writeFileSync(f,'CODEX ORIGINAL');
 if(!W.execute(W.plan(h,opts('claude'))).ok)throw Error('baseline apply failed');
 const cp=fs.readFileSync(cf),replace=P.replace;P.replace=(home,file,...args)=>{const r=replace(home,file,...args);if(file===f)throw Error('injected post-write failure');return r;};
 try{if(W.execute(W.plan(h,opts('codex'))).ok)throw Error('fault did not land');}finally{P.replace=replace;}
 const file=W.receiptPath(h),d=JSON.parse(fs.readFileSync(file));const before=Object.keys(d.records).length;
 d.pending.nextRecords={};fs.writeFileSync(file,JSON.stringify(d));
 const observed=W.inspectRecovery(h);let result;try{result=W.resolveRecovery(h);}catch(e){result={state:'refused',reason:e.message};}const final=JSON.parse(fs.readFileSync(file));
 console.log(JSON.stringify({source:require('child_process').execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),originalOwnedRecords:before,plantedNextRecords:0,inspection:observed.state,resolution:result.state,finalOwnedRecords:Object.keys(final.records).length,unrelatedHostBytesPreserved:cp.equals(fs.readFileSync(cf)),originalOwnershipLost:Object.keys(final.records).length<before}));
}finally{fs.rmSync(h,{recursive:true,force:true});}
