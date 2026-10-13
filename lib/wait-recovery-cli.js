'use strict';
// A public projection of the existing wait owner. Never serialize raw receipts,
// filesystem exceptions, host text, policy values or arbitrary recovery paths.
const fs=require('fs'),path=require('path');
const W=require('./wait-rules'),R=require('./wait-recovery'),B=require('./backup-retention'),O=require('./operation-result'),P=require('./wait-rule-policy');
const REMEDY='Preserve the private wait-rule receipt and retained copies for audit. Locks are never cleared by this command.';
function refuse(code){const e=Error(code);e.safeCode=code;throw e;}
function parse(args){
 const [command,...rest]=args;if(!['inspect','finalize'].includes(command))refuse('arguments');
 const f={command,json:false,apply:false,dryRun:false},seen=new Set();
 for(let i=0;i<rest.length;i++){const a=rest[i];if(seen.has(a))refuse('arguments');seen.add(a);
  if(a==='--json')f.json=true;else if(a==='--apply'&&command==='finalize')f.apply=true;
  else if(a==='--dry-run'&&command==='finalize')f.dryRun=true;
  else if(a==='--operation'&&command==='finalize'){f.operation=rest[++i];if(!/^[a-f0-9]{32}$/.test(f.operation||''))refuse('arguments');}
  else refuse('arguments');
 }
 if(command==='finalize'&&!f.operation)refuse('arguments');return f;
}
function exists(file){try{fs.lstatSync(file);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
function admitted(home,env,safe={}){
 const file=W.receiptPath(home),dir=path.dirname(file);
 if(exists(dir))B.privateStat(dir,true);
 if(exists(file+'.lock'))refuse('owner_lock_held');
 if(exists(file))B.privateStat(file);
 const state=W.receipt(home,true),op=state.data.pending||state.data.lastOperation;
 if(!op)return {state,info:{state:'none'},reference:'none'};
 if(op.schema!=='wait-recovery/1')refuse('legacy_pending');R.validate(op);
 Object.assign(safe,{operation:op.operation,agent:op.agent,phase:op.state,reference:op.backup.state});
 const target=W.targets(home,{env}).find(t=>t.agent===op.agent);
 if(!target||target.root!==op.root||target.file!==op.file)refuse('profile_changed');
 const backups=path.join(dir,'backups');
 if(exists(backups)){B.privateStat(backups,true);if(exists(path.join(backups,'.retention.lock')))refuse('backup_lock_held');}
 let reference=op.backup.state;
 if(reference==='referenced'){
  const ref=op.backup.reference;
  if(typeof ref.file!=='string'||!/^\.retain-[a-f0-9]{64}\.json$/.test(path.basename(ref.file))||path.dirname(ref.file)!==fs.realpathSync.native(backups)||ref.receipt!==fs.realpathSync.native(file))refuse('reference_namespace');
  reference=B.retired(ref)?'retired':'active';
  if(reference==='retired'){
   const retired=path.join(backups,'.released-'+path.basename(ref.file).slice('.retain-'.length));
   const d=require('./json-spans').parse(fs.readFileSync(retired,'utf8')).data;
   const {file:ignored,...expected}=ref;
   if(!require('util').isDeepStrictEqual(d,expected))refuse('retirement_binding');
  }
 }
 safe.reference=reference;
 const checked=W.previewRecovery(home);
 if(!P.same(state.before,checked.state.before))refuse('evidence_changed');
 if(!['none','before','after','no-op'].includes(checked.info.state))refuse('evidence_unresolved');
 return {...checked,op,reference};
}
function project(f,value,status,state){
 const op=value.op;return {schema:'wait-recovery-inspection/1',owner:'wait-rules',command:f.command,...O.result({scope:'home',status,evidence:'source CLI; metadata only; no installed or native behavior claim'}),state,operation:op?.operation||null,agent:op?.agent||null,phase:op?.state||null,snapshot:value.info.state,reference:value.reference,canFinalize:['before','after','no-op'].includes(value.info.state),reasonCode:'none'};
}
function execute(args,{home,env=process.env}){
 let f;try{f=parse(args);}catch(e){return {code:2,json:args.includes('--json'),value:{schema:'wait-recovery-inspection/1',owner:'wait-rules',command:'invalid',...O.result({scope:'none',status:'failed',errorClass:'parse',remediation:'Use rules recovery inspect or finalize --operation <id> [--apply].'}),state:'unresolved',canFinalize:false,reasonCode:'arguments'}};}
 let stage='private_or_invalid_state';const safe={};
 try{
  const value=admitted(home,env,safe);
  if(f.command==='finalize'&&value.op?.operation!==f.operation)refuse('stale_operation');
  let state=value.op?(value.info.state==='none'?'complete':'pending'):'none';
  const status=((f.command==='finalize'&&!f.apply)||f.dryRun)?'dry-run':'ok';
  if(f.command==='finalize'&&f.apply&&!f.dryRun){
   stage='finalization_unresolved';const result=W.resolveRecovery(home,{operation:f.operation,before:value.state.before});
   state=result.state==='none'?'complete':result.state;
   const final=admitted(home,env);return {code:0,json:f.json,value:project(f,final,'ok',state)};
  }
  return {code:0,json:f.json,value:project(f,value,status,state)};
 }catch(e){return {code:1,json:f.json,value:{schema:'wait-recovery-inspection/1',owner:'wait-rules',command:f.command,...O.result({scope:'home',status:'unknown',errorClass:'unknown',remediation:REMEDY}),state:'unresolved',...safe,canFinalize:false,reasonCode:e.safeCode||stage}};}
}
function cli(args,options,write=s=>process.stdout.write(s)){
 const r=execute(args,options),v=r.value;
 if(r.json)write(JSON.stringify(v)+'\n');
 else {write(`rules.wait recovery: ${v.state}; ${v.status}; metadata only\n`);if(v.operation)write(`  operation: ${v.operation}; host: ${v.agent}; phase: ${v.phase}; reference: ${v.reference}\n`);if(v.reasonCode!=='none')write(`  ${v.reasonCode}: ${v.remediation}\n`);else if(v.canFinalize)write(`  ${v.command==='finalize'?'Finalize metadata':'Preview'}: npx sshlg-skills rules recovery finalize --operation ${v.operation}${v.command==='finalize'?' --apply':''}\n`);write('  Host instructions are not restored or rewritten by recovery.\n');}
 return r.code;
}
module.exports={parse,execute,cli};
