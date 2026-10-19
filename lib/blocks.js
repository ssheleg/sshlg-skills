'use strict';
// Metadata-only inspection. A recognized marker is never write authority.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const SCOPE=[['claude','CLAUDE_CONFIG_DIR','.claude','CLAUDE.md'],['codex','CODEX_HOME','.codex','AGENTS.md'],['gemini','GEMINI_CLI_HOME','.gemini','GEMINI.md','.gemini'],['pi','PI_CODING_AGENT_DIR','.pi/agent','AGENTS.md'],['cursor',null,'.cursor/rules','sshlg-routing.mdc'],['cursor',null,'.cursor/rules','sshlg-wait.mdc']];
const MAX_BYTES=1024*1024;
function decode(bytes){const s=bytes.toString('utf8');if(!Buffer.from(s,'utf8').equals(bytes))throw Error('INVALID_UTF8');return s;}
// managed-blocks/1 ownership (docs/working-rules/managed-blocks.md § Block names). The
// registry names who writes a block; it never authorizes the hub to write a foreign one.
const REGISTRY={
 'SSHLG:ROUTERS':{owner:'sshlg-skills',writer:'npx sshlg-skills install/update (lib/apply.js)',dedicated:true},
 'SSHLG:RULE:wait-is-not-a-stop':{owner:'sshlg-skills',writer:'npx sshlg-skills rules (lib/wait-rules.js)',dedicated:true},
 // A project's own CLAUDE.md/AGENTS.md, not a host's global file: the routes that apply to that repository.
 'SSHLG:PROJECT':{owner:'sshlg-skills',writer:'npx sshlg-skills enroll (lib/enroll.js)',dedicated:true},
 'SSHLG:REPOSITORY-HANDOFF':{owner:null,writer:null,undecided:'B-174: the operator has not decided which tool owns it'},
 'OBSERVATORY:AGENT-UPDATES':{owner:'project-observatory',writer:'agent_updates.py through npx sshlg-skills blocks install --owner OBSERVATORY'},
};
function admission(id){if(id==='SSHLG:REPOSITORY-HANDOFF')return 'OPERATOR_DECISION_REQUIRED';if(REGISTRY[id]||subregion(id))return 'REGISTERED_NOT_AUTHORIZED';return 'FOREIGN';}
function registered(id){const r=REGISTRY[id]||(subregion(id)?REGISTRY['SSHLG:ROUTERS']:null);return r?{owner:r.owner,writer:r.writer}:null;}
function subregion(id){return /^SSHLG:ROUTER:[a-z0-9-]+$/.test(id)||/^SSHLG:ROUTERS:(MAP|PROTOCOL|TABLE)$/.test(id);}
// Closed Markdown code fences (``` or ~~~, up to three spaces of indent). A marker inside
// one is an example in prose, not a block: it is neither listed nor written. An unclosed
// fence fences nothing, so it can never hide a real block's END.
function fences(text){
 const out=[];let open=null,at=0;
 for(const line of text.split('\n')){
  const m=/^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line.replace(/\r$/,''));
  if(!open){if(m&&!(m[1][0]==='`'&&m[2].includes('`')))open={ch:m[1][0],len:m[1].length,start:at};}
  else if(m&&m[1][0]===open.ch&&m[1].length>=open.len&&!m[2].trim()){out.push([open.start,at+line.length]);open=null;}
  at+=line.length+1;
 }
 return out;
}
function parse(text){
 const blocks=[],issues=[],stack=[],seen=new Set();const tokens=[];const re=/<!--[\s\S]*?(?:-->|$)/g;let match;
 const fenced=fences(text);let f=0;const inFence=at=>{while(f<fenced.length&&fenced[f][1]<at)f++;return f<fenced.length&&fenced[f][0]<=at&&at<=fenced[f][1];};
 const starts=[0];for(let i=text.indexOf('\n');i!==-1;i=text.indexOf('\n',i+1))starts.push(i+1);
 const line=at=>{let lo=0,hi=starts.length;while(lo<hi){const mid=(lo+hi)>>>1;if(starts[mid]<=at)lo=mid+1;else hi=mid;}return lo;};
 while((match=re.exec(text))){
  // A comment opened inside a fence ends with the fence: resume scanning after it, so an
  // unterminated `<!--` in an example cannot swallow a real marker below.
  if(inFence(match.index)){re.lastIndex=fenced[f][1];continue;}
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
   const b={markerId:t.id,range:{startLine:t.line,endLine:t.kind==='OPTOUT'?t.endLine:null},syntaxState:bad?'AMBIGUOUS':t.kind==='OPTOUT'?'OPTOUT':allowed?'NESTED_SUBREGION':'PAIRED',claimedOwner:t.id.split(':')[0],registered:registered(t.id),writerAdmission:admission(t.id),lastJournalState:'NOT_READ'};
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
 return SCOPE.filter(x=>!agents.length||agents.includes(x[0])).map(([host,key,rel,name,under=''])=>{
  // `under`: the host variable replaces HOME (GEMINI_CLI_HOME, B-204), so the file sits below it.
  const override=key&&env[key];if(override&&!path.isAbsolute(override))throw Error('Profile override must be absolute');
  return {host,pathAlias:override?'${'+key+'}/'+(under?under+'/':'')+name:'~/'+rel+'/'+name,rootSource:override?'env':'default',file:path.join(override?path.join(override,under):path.join(home,rel),name)};
 });
}
// INST-3: markers alone said "syntax valid" while a line the pack never wrote sat inside
// a block it owns. Each hub-owned block is compared with the hub's own record of what it
// wrote — the wait-rule ownership receipt, the routing block's rendered-hash record — and
// a difference is reported by line, never by content. Read-only: a missing or unreadable
// record is a state, not a reason to create one.
function record(home,name){try{return JSON.parse(fs.readFileSync(path.join(home,'.sshlg-skills',name),'utf8'));}catch(e){return e.code==='ENOENT'?null:{unreadable:true};}}
const REGION=/^SSHLG:ROUTERS:(MAP|PROTOCOL|TABLE)$/,SECTION=/^SSHLG:ROUTER:([a-z0-9-]+)$/,WAIT='SSHLG:RULE:wait-is-not-a-stop';
function content(file,r,home){
 if(r.readState!=='READ'||!home)return;
 const F=require('./foreign-lines.js'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
 let wait,routed;
 for(const b of r.blocks){
  if(b.offset.end===null||!['PAIRED','NESTED_SUBREGION'].includes(b.syntaxState))continue;
  const own=r.text.slice(b.offset.start,b.offset.end);
  if(b.markerId===WAIT){
   if(wait===undefined)wait=record(home,'wait-rules.json');
   if(!wait||wait.unreadable){b.content={state:wait?'RECORD_UNREADABLE':'NO_RECORD'};continue;}
   const rec=Object.values(wait.records||{}).find(x=>x&&x.file===file);
   if(!rec||typeof rec.segment!=='string'){b.content={state:'NO_RECORD'};continue;}
   const range=F.changedRange(own,rec.segment.slice(rec.segment.indexOf('<!--')).replace(/\n$/,''),b.range.startLine);
   b.content=range?{state:'FOREIGN_TEXT_INSIDE',startLine:range.startLine,endLine:range.endLine}:{state:'AS_WRITTEN'};
  }else if(REGION.test(b.markerId)||SECTION.test(b.markerId)){
   if(routed===undefined)routed=record(home,'routers-rendered.json');
   const rec=routed&&!routed.unreadable&&routed.files&&routed.files[file];
   if(!rec){b.content={state:routed&&routed.unreadable?'RECORD_UNREADABLE':'NO_RECORD'};continue;}
   const m=REGION.exec(b.markerId),want=m?(rec.regions||{})[m[1]]:(rec.sections||{})[SECTION.exec(b.markerId)[1]];
   // Hashes only, so the range is the block's inner lines rather than the exact line.
   b.content=!want?{state:'NO_RECORD'}:want===sha(own)?{state:'AS_WRITTEN'}:{state:'FOREIGN_TEXT_INSIDE',startLine:b.range.startLine+1,endLine:Math.max(b.range.startLine+1,b.range.endLine-1)};
  }
 }
}
function inspect(options){
 const rows=targets(options).map(({file,...meta})=>{const r=read(file,options.io);content(file,r,options.home);return {...meta,...r,writeAuthorized:false};});
 const foreign=x=>(x.blocks||[]).some(b=>b.content&&b.content.state==='FOREIGN_TEXT_INSIDE');
 return {schema:'managed-blocks-inspection/1',sourceCut:'sshlg-skills@'+require('../package.json').version,observedAt:new Date().toISOString(),ok:rows.every(x=>(x.readState==='ABSENT'||x.readState==='READ'&&x.ok)&&!foreign(x)),targets:rows};
}
function foreignLines(t){return (t.blocks||[]).filter(b=>b.content&&b.content.state==='FOREIGN_TEXT_INSIDE').map(b=>`\n  FOREIGN_TEXT_INSIDE ${b.markerId} lines ${b.content.startLine===b.content.endLine?b.content.startLine:b.content.startLine+'-'+b.content.endLine} — text the pack did not write; move it outside the block's markers`).join('');}
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
const USAGE=`npx sshlg-skills blocks [--agent claude|codex|gemini|pi|cursor] [--json]   # list markers, read-only
npx sshlg-skills blocks diff OWNER:NAME --from <local-file> --agent <host>   # selected local diff, read-only
`;
function cli(args,options,write){
 if(['install','uninstall','resolve'].includes(args[0]))return require('./blockwriter.js').cli(args,options,write);
 if(args.includes('--help')||args.includes('-h')){write(USAGE+require('./blockwriter.js').USAGE);return 0;}
 const f=flags(args);if(f.diff){write(localDiff({...options,...f}));return 0;}const r=inspect({...options,...f});write(f.json?JSON.stringify(r,null,2)+'\n':r.targets.map(t=>`${t.host} ${t.pathAlias}: ${t.readState}${t.blocks?' ('+t.blocks.length+' markers; '+(t.ok?'syntax valid':'syntax uncertain')+')':''}${foreignLines(t)}`).join('\n')+'\nRead-only metadata; marker ownership does not authorize writes.\n');return r.ok?0:1;}
module.exports={parse,decode,read,inspect,flags,localDiff,cli,targets,REGISTRY};
