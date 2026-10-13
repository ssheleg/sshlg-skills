'use strict';
// Metadata-only inspection. A recognized marker is never write authority.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const SCOPE=[['claude','CLAUDE_CONFIG_DIR','.claude','CLAUDE.md'],['codex','CODEX_HOME','.codex','AGENTS.md'],['gemini','GEMINI_CONFIG_DIR','.gemini','GEMINI.md'],['pi','PI_CODING_AGENT_DIR','.pi/agent','AGENTS.md'],['cursor',null,'.cursor/rules','sshlg-routing.mdc'],['cursor',null,'.cursor/rules','sshlg-wait.mdc']];
const MAX_BYTES=1024*1024;
function decode(bytes){const s=bytes.toString('utf8');if(!Buffer.from(s,'utf8').equals(bytes))throw Error('INVALID_UTF8');return s;}
function admission(id){if(id==='SSHLG:REPOSITORY-HANDOFF')return 'OPERATOR_DECISION_REQUIRED';if(id==='SSHLG:ROUTERS'||id==='SSHLG:RULE:wait-is-not-a-stop'||subregion(id))return 'REGISTERED_NOT_AUTHORIZED';return 'FOREIGN';}
function subregion(id){return /^SSHLG:ROUTER:[a-z0-9-]+$/.test(id)||/^SSHLG:ROUTERS:(MAP|PROTOCOL|TABLE)$/.test(id);}
function parse(text){
 const blocks=[],issues=[],stack=[],seen=new Set();const tokens=[];const re=/<!--[\s\S]*?(?:-->|$)/g;let match;
 const line=at=>text.slice(0,at).split('\n').length;
 while((match=re.exec(text))){
  const body=match[0].slice(4);if(!/[^\s<>:]+\s*:\s*[^\s<>:]+\s*:\s*(?:BEGIN|END|OPTOUT)\b/i.test(body))continue;
  const m=/^[ \t]*([A-Za-z0-9_.-]+(?::[A-Za-z0-9_.-]+)+):(BEGIN|END|OPTOUT)(?=[ \t\r\n]|-->)/.exec(body);
  if(!m||!match[0].endsWith('-->')||m[1].length>128){issues.push({code:'MALFORMED_MARKER',line:line(match.index)});continue;}
  // End and opt-out markers carry no trailing instructions. BEGIN may carry a descriptive tail.
  if(m[2]!=='BEGIN'&&!/^[ \t\r\n]*-->$/.test(body.slice(m[0].length))){issues.push({code:'MALFORMED_MARKER',line:line(match.index)});continue;}
  tokens.push({id:m[1],kind:m[2],start:match.index,end:re.lastIndex,line:line(match.index),endLine:line(re.lastIndex-1)});
 }
 for(const t of tokens){
  if(t.kind==='BEGIN'||t.kind==='OPTOUT'){
   const nested=stack.length>0;const allowed=nested&&stack.length===1&&stack[0].id==='SSHLG:ROUTERS'&&subregion(t.id)&&t.kind==='BEGIN';
   const bad=seen.has(t.id)||(nested&&!allowed)||(!nested&&subregion(t.id));
   const b={markerId:t.id,range:{startLine:t.line,endLine:t.kind==='OPTOUT'?t.endLine:null},syntaxState:bad?'AMBIGUOUS':t.kind==='OPTOUT'?'OPTOUT':allowed?'NESTED_SUBREGION':'PAIRED',claimedOwner:t.id.split(':')[0],writerAdmission:admission(t.id),lastJournalState:'NOT_READ'};
   // Offsets are private parser data and never part of public JSON.
   Object.defineProperty(b,'offset',{value:{start:t.start,end:t.kind==='OPTOUT'?t.end:null},enumerable:false});
   if(bad)issues.push({code:'AMBIGUOUS_MARKER',line:t.line});seen.add(t.id);blocks.push(b);
   if(t.kind==='BEGIN')stack.push({id:t.id,b});
  }else{
   const active=stack[stack.length-1];
   if(!active||active.id!==t.id){issues.push({code:'UNMATCHED_END',line:t.line});continue;}
   stack.pop();active.b.range.endLine=t.endLine;active.b.offset.end=t.end;
  }
 }
 for(const {b}of stack){b.syntaxState='MALFORMED';issues.push({code:'UNCLOSED_BEGIN',line:b.range.startLine});}
 return {ok:issues.length===0,blocks,issues};
}
function same(a,b){return a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs&&a.mode===b.mode;}
function read(file,io=fs){
 let fd;
 try{
  const parent=io.realpathSync(path.dirname(file)),pre=io.lstatSync(file);
  if(!pre.isFile()||pre.isSymbolicLink())return {readState:'UNSUPPORTED',reason:'FILE_KIND'};
  if(!(pre.mode&0o444))return {readState:'UNKNOWN',reason:'UNREADABLE'};
  if(pre.size>MAX_BYTES)return {readState:'UNKNOWN',reason:'SIZE_LIMIT'};
  fd=io.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
  if(!same(pre,io.fstatSync(fd)))return {readState:'CHANGED_DURING_READ'};
  const buffer=Buffer.alloc(MAX_BYTES+1);let count=0;
  while(count<buffer.length){const got=io.readSync(fd,buffer,count,buffer.length-count,null);if(!got)break;count+=got;}
  if(count>MAX_BYTES)return {readState:'UNKNOWN',reason:'SIZE_LIMIT'};const bytes=buffer.subarray(0,count);
  if(!same(pre,io.fstatSync(fd))||!same(pre,io.lstatSync(file))||parent!==io.realpathSync(path.dirname(file)))return {readState:'CHANGED_DURING_READ'};
  const text=decode(bytes),parsed=parse(text);
  const r={readState:'READ',bytes:bytes.length,mode:pre.mode&0o777,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),...parsed};
  Object.defineProperty(r,'text',{value:text,enumerable:false});return r;
 }catch(e){return {readState:e.code==='ENOENT'?'ABSENT':'UNKNOWN',reason:e.code==='ENOENT'?'MISSING':e.message==='INVALID_UTF8'?'INVALID_UTF8':e.code==='EACCES'?'UNREADABLE':'READ_ERROR'};}
 finally{if(fd!==undefined)io.closeSync(fd);}
}
function targets({home,env={},agents=[]}){
 const supported=new Set(SCOPE.map(x=>x[0]));for(const a of agents)if(!supported.has(a))throw Error('Unsupported blocks host: '+a);
 return SCOPE.filter(x=>!agents.length||agents.includes(x[0])).map(([host,key,rel,name])=>{
  const override=key&&env[key];if(override&&!path.isAbsolute(override))throw Error('Profile override must be absolute');
  return {host,pathAlias:override?'${'+key+'}/'+name:'~/'+rel+'/'+name,rootSource:override?'env':'default',file:path.join(override||path.join(home,rel),name)};
 });
}
function inspect(options){
 const rows=targets(options).map(({file,...meta})=>({...meta,...read(file,options.io),writeAuthorized:false}));
 return {schema:'managed-blocks-inspection/1',sourceCut:'sshlg-skills@'+require('../package.json').version,observedAt:new Date().toISOString(),ok:rows.every(x=>x.readState==='ABSENT'||x.readState==='READ'&&x.ok),targets:rows};
}
function flags(args){const r={agents:[],json:false};let seen=new Set();
 if(args[0]==='diff'){r.diff=true;r.id=args[1];args=args.slice(2);if(!r.id||!/^[-A-Za-z0-9_.:]+$/.test(r.id))throw Error('diff needs a marker id');}
 for(let i=0;i<args.length;i++){const a=args[i];if(seen.has(a))throw Error('Duplicate flag: '+a);seen.add(a);
  if(a==='--json')r.json=true;
  else if(a==='--agent'||a==='--from'){const v=args[++i];if(!v||v.startsWith('--'))throw Error('Missing flag value');if(a==='--agent')r.agents=v.split(',');else r.from=v;}
  else throw Error('Unknown blocks flag: '+a);
 }
 for(const a of r.agents)if(!SCOPE.some(x=>x[0]===a))throw Error('Unsupported blocks host: '+a);
 if(r.diff){if(r.json||!r.from||r.agents.length!==1)throw Error('diff requires one --agent and --from, without --json');}
 else if(r.from)throw Error('--from requires diff');return r;
}
function localDiff(options){
 if(!options.agents||options.agents.length!==1||!options.from||/^[a-z]+:\/\//i.test(options.from))throw Error('Select one host and a local source file');
 const candidates=targets(options).map(t=>({t,r:read(t.file,options.io)}));
 if(candidates.some(x=>!['READ','ABSENT'].includes(x.r.readState)||x.r.readState==='READ'&&!x.r.ok))throw Error('Target inspection is partial or malformed');
 const matches=candidates.flatMap(x=>(x.r.blocks||[]).filter(b=>b.markerId===options.id&&['PAIRED','OPTOUT'].includes(b.syntaxState)).map(b=>({...x,b})));
 if(matches.length!==1)throw Error('Marker must select exactly one complete target block');
 const proposed=read(path.resolve(options.from),options.io);
 if(proposed.readState!=='READ'||!proposed.ok||proposed.blocks.filter(b=>!['NESTED_SUBREGION'].includes(b.syntaxState)).length!==1)throw Error('Source needs one complete block');
 const pb=proposed.blocks.find(b=>b.markerId===options.id);if(!pb||!['PAIRED','OPTOUT'].includes(pb.syntaxState))throw Error('Source marker does not match');
 const current=matches[0];const before=current.r.text.slice(current.b.offset.start,current.b.offset.end),after=proposed.text.slice(pb.offset.start,pb.offset.end);
 return before===after?'No block changes.\n':['--- current selected block','+++ proposed selected block',...before.split('\n').map(x=>'-'+x),...after.split('\n').map(x=>'+'+x),'Read-only: no bytes changed; no write authority inferred.',''].join('\n');
}
function cli(args,options,write){const f=flags(args);if(f.diff){write(localDiff({...options,...f}));return 0;}const r=inspect({...options,...f});write(f.json?JSON.stringify(r,null,2)+'\n':r.targets.map(t=>`${t.host} ${t.pathAlias}: ${t.readState}${t.blocks?' ('+t.blocks.length+' markers; '+(t.ok?'syntax valid':'syntax uncertain')+')':''}`).join('\n')+'\nRead-only metadata; marker ownership does not authorize writes.\n');return r.ok?0:1;}
module.exports={parse,decode,read,inspect,flags,localDiff,cli,targets};
