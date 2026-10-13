'use strict';
// The existing wait-rules receipt remains the operation authority. Recovery here
// classifies or finalizes metadata only; it never restores/repeats a host write.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const P=require('./wait-rule-policy'),B=require('./backup-retention'),J=require('./json-spans');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function fingerprint(snapshot){return snapshot===null?{exists:false,sha256:null,mode:null}:{exists:true,sha256:hash(snapshot.text),mode:snapshot.mode};}
function same(a,b){return a.exists===b.exists&&a.sha256===b.sha256&&a.mode===b.mode;}
function shape(s){return s&&typeof s.exists==='boolean'&&(s.exists?/^[a-f0-9]{64}$/.test(s.sha256)&&Number.isSafeInteger(s.mode)&&s.mode>=0&&s.mode<=0o777:s.sha256===null&&s.mode===null);}
function make(plan,row){
 return {schema:'wait-recovery/1',operation:crypto.randomBytes(16).toString('hex'),state:'prepared',agent:row.agent,file:row.file,root:row.root,canonicalRoot:fs.realpathSync.native(row.root),canonicalFile:row.before?fs.realpathSync.native(row.file):path.join(fs.realpathSync.native(row.root),path.basename(row.file)),before:fingerprint(row.before),after:row.delete?fingerprint(null):fingerprint({text:row.text,mode:row.before?row.before.mode:0o600}),policy:{file:plan.policy.file,...fingerprint(plan.policy.before)},backup:{state:'unprepared'}};
}
function validate(op){
 if(!op||op.schema!=='wait-recovery/1'||!/^[a-f0-9]{32}$/.test(op.operation)||!['prepared','write-intent','verified','recovered-no-write','recovered-committed'].includes(op.state)||!['claude','codex','gemini','pi','cursor'].includes(op.agent)||!['file','root','canonicalRoot','canonicalFile'].every(k=>typeof op[k]==='string'&&path.isAbsolute(op[k]))||!shape(op.before)||!shape(op.after)||!shape(op.policy)||typeof op.policy.file!=='string'||!path.isAbsolute(op.policy.file)||!op.backup||!['unprepared','absent','referenced'].includes(op.backup.state))throw Error('unknown wait recovery operation');
 const leaf={claude:'CLAUDE.md',codex:'AGENTS.md',gemini:'GEMINI.md',pi:'AGENTS.md',cursor:'sshlg-wait.mdc'}[op.agent];
 if(path.resolve(op.root,leaf)!==op.file||path.dirname(op.canonicalFile)!==op.canonicalRoot)throw Error('wait recovery target is outside admitted host file');
 if(op.backup.state==='absent'&&op.before.exists)throw Error('missing recovery reference for existing target');
 if(op.backup.state==='referenced'){
  const r=op.backup.reference;
  if(!op.before.exists||!r||r.operation!==op.operation||r.owner!=='wait-rules'||r.sha256!==op.before.sha256||r.target!==op.canonicalFile)throw Error('wait recovery backup does not bind original target');
 }
 return op;
}
function inspect(home,data){
 const op=data.pending||data.lastOperation;
 if(!op)return {state:'none'};
 if(op.schema!=='wait-recovery/1')return {state:'legacy-unresolved',reason:'legacy pending has no existence-aware backup binding'};
 try{
  validate(op);
  if(fs.realpathSync.native(op.root)!==op.canonicalRoot)throw Error('wait recovery profile changed');
  const policy=P.read(home);
  if(policy.file!==op.policy.file||!same(fingerprint(policy.before),op.policy))throw Error('wait recovery consent changed');
  if(op.backup.state==='unprepared')throw Error('wait recovery backup preparation is incomplete');
  if(op.backup.state==='referenced'){if(op.backup.reference.receipt!==fs.realpathSync.native(path.join(home,'.sshlg-skills','wait-rules.json')))throw Error('wait recovery references a different owner receipt');B.verify(op.backup.reference);}
  const actual=fingerprint(P.snapshot(op.file)),before=same(actual,op.before),after=same(actual,op.after);
  if(!before&&!after)throw Error('wait recovery target matches neither recorded snapshot');
  if(!data.pending && !same(actual,op.state==='recovered-no-write'?op.before:op.after))throw Error('terminal wait target changed after its recorded outcome');
  return {state:before&&after?'no-op':after?'after':'before',operation:op};
 }catch(e){return {state:'unresolved',reason:e.message,operation:op};}
}
// Fixed adapter admission for retiring a retention reference. Called while the
// wait receipt lock is held; the backup library rechecks this exact byte snapshot.
function terminalProof(reference){
 B.privateStat(reference.receipt);
 const bytes=fs.readFileSync(reference.receipt),s=bytes.toString('utf8');if(!Buffer.from(s).equals(bytes))throw Error('wait receipt is not lossless UTF-8');
 const data=J.parse(s).data,op=validate(data.lastOperation);
 if(data.schema!==1||data.pending||!['verified','recovered-no-write','recovered-committed'].includes(op.state)||op.operation!==reference.operation||op.backup.state!=='referenced'||op.backup.reference.file!==reference.file)throw Error('retention release lacks exact terminal wait receipt');
 if(reference.receipt!==fs.realpathSync.native(path.join(path.dirname(op.policy.file),'wait-rules.json')))throw Error('retention owner is not the wait receipt beside its policy');
 const desired=op.state==='recovered-no-write'?op.before:op.after;
 if(fs.realpathSync.native(op.root)!==op.canonicalRoot||!same(fingerprint(P.snapshot(op.file)),desired))throw Error('terminal wait target differs from receipt');
 return {receiptSha256:hash(bytes),target:op.file,root:op.root,canonicalRoot:op.canonicalRoot,desired};
}
module.exports={make,validate,inspect,terminalProof,fingerprint,same};
