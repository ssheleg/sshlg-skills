'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const P=require('./wait-rule-policy.js'),T=require('./wait-rule-text.js'),A=require('./apply.js');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const object=x=>x!==null && typeof x==='object' && !Array.isArray(x);
const receiptPath=home=>path.join(home,'.sshlg-skills','wait-rules.json');
function segmentFor(agent,prefix='') {
 const body=T.render(agent);
 return agent==='cursor'?'---\ndescription: Continue authorized work while dependencies wait\nalwaysApply: true\n---\n\n'+body:prefix+body;
}
function knownSegment(record) {
 // A future doctrine revision must explicitly retain its supported predecessor
 // here. A self-consistent hash alone cannot authorize arbitrary foreign text.
 return record.sourceRevision==='wait-v1' && ['', '\n', '\n\n'].some(prefix=>segmentFor(record.agent,prefix)===record.segment);
}
function receipt(home){
 const file=receiptPath(home),before=P.snapshot(file);
 const data=before?require('./json-spans.js').parse(before.text).data:{schema:1,records:{}};
 if(!object(data)||data.schema!==1||!object(data.records))throw Error('unknown wait-rule receipt');
 if(Object.prototype.hasOwnProperty.call(data,'pending'))throw Error('unfinished wait-rule write; inspect receipt and backup before recovery');
 for(const [id,r] of Object.entries(data.records)){
  if(!object(r)||!['claude','codex','gemini','pi','cursor'].includes(r.agent)||!['root','canonicalRoot','file','segment','sourceHash'].every(k=>typeof r[k]==='string')||id!==digest(r.file)||!path.isAbsolute(r.file)||!path.isAbsolute(r.root)||!path.isAbsolute(r.canonicalRoot)||r.sourceHash!==digest(r.segment)||!knownSegment(r))throw Error('invalid wait-rule ownership record');
 }
 return {file,before,data};
}
function targets(home,opts){
 const out=[];
 for(const t of opts.hostTargets||A.TARGETS){
  const v=A.hostRootVerdict(t,home,opts);
  if(!v.supported)throw Error(v.reason);
  const root=path.resolve(v.root);out.push({agent:t.agent,root,file:path.join(root,t.file)});
 }
 if(opts.cursor!==false){const root=path.resolve(home,'.cursor','rules');out.push({agent:'cursor',root,file:path.join(root,'sshlg-wait.mdc')});}
 return out;
}
function markers(text){
 const begins=text.split(T.BEGIN).length-1,ends=text.split(T.END).length-1;
 if(begins!==ends||begins>1||(begins===1&&text.indexOf(T.BEGIN)>text.indexOf(T.END)))throw Error('malformed or duplicate wait-rule markers');
 // A partial or differently formatted marker is not a licence to append another.
 if(text.split('SSHLG:RULE:wait-is-not-a-stop').length-1!==begins+ends)throw Error('unknown wait-rule marker');
 return begins;
}
function plan(home,opts={}){
 const policy=P.read(home),state=receipt(home),rows=[];
 for(const target of targets(home,opts)){
  const id=digest(target.file),owned=state.data.records[id];
  if(opts.automatic&&!owned){rows.push({...target,id,action:'not-applied'});continue;}
  let stat;
  try{stat=fs.statSync(target.root);}catch(e){if(e.code==='ENOENT'&&!owned){rows.push({...target,id,action:'agent-absent'});continue;}throw e;}
  if(!stat.isDirectory())throw Error('working-rule host root is not a directory');
  const canonicalRoot=fs.realpathSync(target.root);
  if(owned&&(owned.agent!==target.agent||owned.root!==target.root||owned.canonicalRoot!==canonicalRoot||owned.file!==target.file))throw Error('wait-rule profile binding changed');
  const before=P.snapshot(target.file),raw=before?before.text:'';
  const count=markers(raw);
  if(owned&&(!count||raw.split(owned.segment).length!==2))throw Error('owned wait rule was edited or removed; preserve it and review ownership');
  if(!owned&&count)throw Error('wait-rule block has no ownership receipt');
  if(!owned&&target.agent==='cursor'&&before&&policy.enabled&&!opts.remove)throw Error('foreign Cursor wait-rule filename is occupied');
  const enabled=policy.enabled&&!opts.remove;
  let segment='';
  if(enabled){
   segment=segmentFor(target.agent,owned?owned.segment.slice(0,owned.segment.indexOf(T.BEGIN)):(raw?(raw.endsWith('\n')?'\n':'\n\n'):''));
  }
  const text=owned?raw.replace(owned.segment,segment):(enabled?raw+segment:raw);
  rows.push({...target,id,canonicalRoot,before,text,segment,owned:owned||null,delete:target.agent==='cursor'&&!!owned&&!enabled&&text==='',action:text===raw?'unchanged':enabled?'write':'remove',sourceHash:digest(segment)});
 }
 return {home,policy,state,rows};
}
function execute(planned){
 const {home}=planned;
 if(!planned.rows.some(r=>['write','remove'].includes(r.action)))return {ok:true,results:planned.rows.map(r=>({agent:r.agent,file:r.file,action:r.action}))};
 // Lock private ownership independently from the legacy router writer.
 const file=receiptPath(home);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 return P.locked(file,()=>{
  if(!P.same(P.snapshot(planned.policy.file),planned.policy.before)||!P.same(P.snapshot(file),planned.state.before))throw Error('wait-rule policy or receipt changed since preview');
  const results=[];let data=planned.state.data,current=planned.state.before;
  for(const row of planned.rows){
   if(!['write','remove'].includes(row.action)){results.push({agent:row.agent,file:row.file,action:row.action});continue;}
   try{
    const currentConsent=()=>{
     if(!P.same(P.snapshot(planned.policy.file),planned.policy.before))throw Error('wait-rule policy changed since preview');
     if(!P.same(P.snapshot(file),current))throw Error('wait-rule ownership journal changed during apply');
     if(fs.realpathSync(row.root)!==row.canonicalRoot)throw Error('wait-rule profile binding changed during apply');
    };
    currentConsent();
    if(fs.realpathSync(row.root)!==row.canonicalRoot||!P.same(P.snapshot(row.file),row.before))throw Error('wait-rule target changed since preview');
    // Journal before the outward write. A crash leaves an explicit pending
    // operation, not guessed ownership or an automatic retry.
    const pending={agent:row.agent,file:row.file,beforeHash:digest(row.before?row.before.text:''),afterHash:digest(row.text)};
    const staged={...data,pending};P.replace(home,file,current,JSON.stringify(staged,null,2)+'\n');current=P.snapshot(file);
    P.replace(home,row.file,row.before,row.delete?null:row.text,currentConsent);
    const records={...data.records};
    if(row.segment)records[row.id]={agent:row.agent,root:row.root,canonicalRoot:row.canonicalRoot,file:row.file,segment:row.segment,previousSegment:row.owned?row.owned.segment:null,sourceRevision:'wait-v1',sourceHash:row.sourceHash};
    else delete records[row.id];
    data={schema:1,records};P.replace(home,file,current,JSON.stringify(data,null,2)+'\n');current=P.snapshot(file);
    results.push({agent:row.agent,file:row.file,action:row.action});
   }catch(e){results.push({agent:row.agent,file:row.file,action:'failed',error:e.message});return {ok:false,results};}
  }
  return {ok:true,results};
 });
}
module.exports={receiptPath,receipt,targets,plan,execute};
