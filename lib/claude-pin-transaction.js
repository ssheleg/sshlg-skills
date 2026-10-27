'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const P=require('./claude-pinned'),S=require('./claude-plugin-source'),A=require('./apply'),atomic=require('./atomicwrite');
function text(file){try{return fs.readFileSync(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}}
function protect(file,home,dir){const r=A.protect(file,{home,backupDir:dir,keep:Infinity});if(r.action==='backup-failed')throw Error('Claude backup failed; no native action admitted');return r;}
function write(file,body,home,backupDir,expected=text(file)) {
  if(text(file)!==expected) throw Error('Claude file changed before protected write');
  protect(file,home,backupDir);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  if(text(file)!==expected) throw Error('Claude file changed during backup');
  let mode=0o600;
  try {const st=fs.lstatSync(file);if(!st.isFile() || st.isSymbolicLink()) throw Error('non-regular Claude write target');mode=st.mode&0o777;}catch(e){if(e.code!=='ENOENT')throw e;}
  // B-260: the hub's one atomic writer; the target is re-read between flush and rename.
  atomic.write(file,body,{mode,tmpName:'.'+path.basename(file)+'.'+crypto.randomBytes(8).toString('hex')+'.tmp',
    beforeRename:(tmp)=>{if(text(tmp)!==body || text(file)!==expected) throw Error('Claude atomic write changed before replacement');}});
  if(text(file)!==body) throw Error('Claude protected write failed readback');
}
function normalizedForeign(value,jobs) {
  const d=JSON.parse(JSON.stringify(value));
  for(const j of jobs) {
    if(d.enabledPlugins) delete d.enabledPlugins[j.pluginInstall];
    if(d.extraKnownMarketplaces?.[j.marketplace]) {delete d.extraKnownMarketplaces[j.marketplace].source;if(!Object.keys(d.extraKnownMarketplaces[j.marketplace]).length)delete d.extraKnownMarketplaces[j.marketplace];}
  }
  for(const k of ['enabledPlugins','extraKnownMarketplaces']) if(d[k] && !Object.keys(d[k]).length) delete d[k];
  const sort=v=>Array.isArray(v)?v.map(sort):v && typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
  return JSON.stringify(sort(d));
}
function targetSettings(plan) {
  let result=plan.settings.text;
  for(const j of plan.jobs) {
    result=P.editAt(result,['extraKnownMarketplaces',j.marketplace,'source'],{source:'directory',path:j.dir});
    if(!Object.prototype.hasOwnProperty.call(plan.settings.data.enabledPlugins||{},j.pluginInstall) && !j.old) result=P.editAt(result,['enabledPlugins',j.pluginInstall],true);
  }
  return result;
}
function restoreSettings(plan,expected,backupDir) {
  const current=text(plan.settingsFile);
  if(current===null || normalizedForeign(P.parseMetadata(current).data,plan.jobs)!==normalizedForeign(plan.settings.data,plan.jobs)) throw Error('foreign Claude settings changed; preserving current file for recovery');
  write(plan.settingsFile,expected,plan.home,backupDir,current);
}
function foreignRegistry(data,jobs,installed) {
  const result=JSON.parse(JSON.stringify(data));
  if(installed) {for(const j of jobs) delete result.plugins?.[j.pluginInstall];}
  else for(const j of jobs) delete result[j.marketplace];
  const sort=v=>Array.isArray(v)?v.map(sort):v && typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
  return JSON.stringify(sort(result));
}
function verifyForeign(plan) {
  for(const [file,before,installed] of [[plan.registryFile,plan.registry.data,true],[plan.knownFile,plan.known.data,false]]) {
    const raw=text(file),current=raw===null?(installed?{version:2,plugins:{}}:{}):P.parseMetadata(raw).data;
    if(foreignRegistry(current,plan.jobs,installed)!==foreignRegistry(before,plan.jobs,installed)) throw Error('foreign Claude registry entries changed; preserving current file for recovery');
  }
}
function verify(plan,job,row=job.row,files=row.files) {
  const registry=P.parseMetadata(fs.readFileSync(plan.registryFile,'utf8')).data;
  const records=registry.plugins?.[job.pluginInstall];
  if(job.action==='rebind') {
    // Only the marketplace source moved: install records stay exactly as planned and
    // the installed bytes still equal the pin.
    if(canon(records)!==canon(JSON.parse(job.records))) throw Error(job.name+': native install records changed during source rebind');
    return S.verifyPayload(job.old.installPath,{files});
  }
  // Every planned scope at its expected install, every alias exactly as recorded,
  // and nothing else: a scope that appeared or vanished is a readback failure. A
  // scope that was already at the pin stays at the pin, also on rollback.
  const targets=job.targets||[{scope:'user',projectPath:null,exact:false}],aliases=job.aliases||[];
  if(!Array.isArray(records) || records.length!==targets.length+aliases.length) throw Error(job.name+': native installed source readback differs from pin');
  for(const a of aliases) if(!records.some(r=>canon(r)===canon(JSON.parse(a.record)))) throw Error(job.name+': aliased local scope '+a.projectPath+' changed');
  let count=null;
  for(const t of targets) {
    const want=t.exact?job.row:row,want_files=t.exact?job.row.files:files;
    const r=records.find(x=>x && x.scope===t.scope && (t.scope==='user' || x.projectPath===t.projectPath));
    if(!r || r.version!==want.version || r.gitCommitSha!==want.commit) throw Error(job.name+': native installed source readback differs from pin'+(t.scope==='local'?' ('+t.projectPath+')':''));
    const install=r.installPath;
    if(typeof install!=='string' || !require('./visibility-state').profilePath(install).startsWith(path.join(plan.profile,'plugins/cache')+path.sep)) throw Error('native installed root is outside expected cache');
    const n=S.verifyPayload(install,{files:want_files});if(count===null) count=n;
  }
  return count;
}
// One scope's native update, read back on the spot: the target moved to `row`, every
// other record of this plugin is byte for byte what it was. Claude exits 0 when the
// cwd matches no record and then moves a different scope, so the exit code is not
// the verdict (retro #8).
// Claude rewrites a neighbouring record's key order when it saves the file (measured on
// 2.1.299: `projectPath` moved first), so records compare by value, keys sorted.
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']':v && typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v);
function records(plan,job){return P.parseMetadata(fs.readFileSync(plan.registryFile,'utf8')).data.plugins?.[job.pluginInstall]||[];}
function readScope(plan,job,t,before,row) {
  const after=records(plan,job),same=r=>r.scope===t.scope && (t.scope==='user' || r.projectPath===t.projectPath);
  const moved=after.find(same),others=x=>x.filter(r=>!same(r)).map(canon).sort().join('\n');
  if(!moved || moved.version!==row.version || moved.gitCommitSha!==row.commit || after.length!==before.length || others(after)!==others(before))
    throw Error(job.name+': native update did not move exactly the '+(t.scope==='user'?'user scope':'local scope '+t.projectPath));
}
function admitUninstall(plan, job) {
  const records=P.parseMetadata(fs.readFileSync(plan.registryFile,'utf8')).data.plugins?.[job.pluginInstall];
  if(!Array.isArray(records) || records.length!==1 || records[0].scope!=='user') throw Error('native install scope changed before repair');
  const manifest=P.parseMetadata(fs.readFileSync(path.join(records[0].installPath,'.claude-plugin/plugin.json'),'utf8')).data;
  const settings=P.parseMetadata(fs.readFileSync(plan.settingsFile,'utf8')).data;
  if(!job.repairEligible || P.configured(manifest) || Object.prototype.hasOwnProperty.call(settings.pluginConfigs||{},job.pluginInstall)) throw Error('configured plugin repair refused before uninstall');
}
// The oldest Claude Code whose `claude plugin` subcommands, flags and
// installed_plugins.json version 2 this transaction was verified against. Later
// minors and majors are admitted (B-203): verify() reads every install back
// against the pin, so a changed format fails per plugin, not silently.
const MIN_CLAUDE=[2,1,296];
function runtime(runner=spawnSync) {
  const r=runner('claude',['--version'],{encoding:'utf8',timeout:10000,maxBuffer:65536});
  const out=(r.stdout||'').trim(),need='Claude native pin transaction requires verified CLI '+MIN_CLAUDE.join('.')+' or later';
  if(r.status!==0 || r.error || r.signal) throw Error(need+'; `claude --version` did not exit cleanly');
  const m=/^(\d+)\.(\d+)\.(\d+)(?![\d.])/.exec(out);
  if(!m) throw Error(need+'; `claude --version` output is unparsable');
  const v=m.slice(1,4).map(Number),cmp=v.findIndex((n,i)=>n!==MIN_CLAUDE[i]);
  if(cmp!==-1 && v[cmp]<MIN_CLAUDE[cmp]) throw Error(need+' (found '+v.join('.')+')');
  return out;
}
// B-224: transaction retention. Every update that moves a plugin leaves a transaction
// directory; nothing removed them (48 directories, 5,642 files, 128 MB measured on 2026-10-27).
// The newest KEEP_FINISHED finished transactions stay whole. Every unfinished one stays, since
// its recovery needs its receipt, plan and copies: running, uncertain, settings not restored,
// a rollback that failed, or a receipt that cannot be read. An older finished transaction
// retires its copies of files outside the transaction root (Claude's settings and registries,
// the hub's catalogues) into ~/.sshlg-skills/backups/, where ordinary retention keeps ten per
// file (backup.adopt), and then its directory goes.
const KEEP_FINISHED=5;
const TX_NAME=/^(\d+)-[a-f0-9]{12}$/;
function finished(receipt) {
  let r;
  try {r=JSON.parse(fs.readFileSync(receipt,'utf8'));} catch(_) {return null;}
  if(!r || r.schema!=='claude-pin-transaction/1' || r.uncertain || r.settingsRestored!==true || !Array.isArray(r.backups)) return null;
  if(r.status==='complete') return r;
  if(r.status==='failed' && Array.isArray(r.results) && !r.results.some(x=>!x || typeof x.rollback==='string' && x.rollback.startsWith('failed'))) return r;
  return null;
}
function transactions(root) {
  return fs.readdirSync(root).filter(n=>TX_NAME.test(n) && (()=>{const st=fs.lstatSync(path.join(root,n));return st.isDirectory() && !st.isSymbolicLink();})())
    .sort((a,b)=>{const x=BigInt(TX_NAME.exec(a)[1]),y=BigInt(TX_NAME.exec(b)[1]);return x===y?(a<b?-1:a>b?1:0):x<y?-1:1;});
}
function retire(root,home,keep=KEEP_FINISHED) {
  const all=transactions(root);
  let latest=null;
  try {latest=path.basename(path.dirname(JSON.parse(fs.readFileSync(path.join(root,'latest.json'),'utf8')).receipt));} catch(_) {}
  const done=all.filter(n=>finished(path.join(root,n,'receipt.json')));
  const old=done.slice(0,Math.max(0,done.length-keep)).filter(n=>n!==latest);
  const retired=[],adopted=[],errors=[];
  const inside=f=>{const rel=path.relative(root,f);return !rel.startsWith('..') && !path.isAbsolute(rel);};
  for(const n of old) {
    const dir=path.join(root,n);
    try {
      const r=finished(path.join(dir,'receipt.json'));
      // Keys of the operator's files this transaction protected; its own records stay behind.
      const keys=new Set(r.backups.filter(b=>b && b.action==='saved' && typeof b.path==='string' && typeof b.identity==='string' && !inside(b.identity))
        .map(b=>/^(.+--v2-[a-f0-9]{64})\./.exec(path.basename(b.path))).filter(Boolean).map(m=>m[1]));
      const backups=path.join(dir,'backups');
      let names=[];
      try {names=fs.readdirSync(backups);} catch(e) {if(e.code!=='ENOENT') throw e;}
      for(const b of names) {
        const m=/^(.+--v2-[a-f0-9]{64})\.\d{8}T\d{6}Z(?:-\d+)?$/.exec(b);
        if(m && keys.has(m[1])) {require('./backup').adopt({file:path.join(backups,b),home});adopted.push(b);}
      }
      fs.rmSync(dir,{recursive:true,force:false});
      retired.push(n);
    } catch(e) {errors.push(n+': '+e.message);}
  }
  return {kept:all.length-retired.length,retired,adopted:adopted.length,...(errors.length?{errors}:{})};
}
function execute(planned,members,inventory,opts={}) {
  const plan=P.prepare(members,inventory,{home:planned.requested.home,profileRoot:planned.requested.profile});
  if(plan.fingerprint!==planned.fingerprint) throw Error('Claude pin plan changed; preview again before any mutation');
  const runner=opts.runner||spawnSync;
  const version=runtime(runner);
  fs.mkdirSync(plan.transactionRoot,{recursive:true,mode:0o700});
  const lock=path.join(plan.transactionRoot,'lock');fs.mkdirSync(lock,{mode:0o700});
  // Strictly increasing names, so retention's order is the order the transactions ran.
  const last=transactions(plan.transactionRoot).map(n=>Number(TX_NAME.exec(n)[1])).reduce((a,b)=>Math.max(a,b),0);
  const op=path.join(plan.transactionRoot,Math.max(Date.now(),last+1)+'-'+crypto.randomBytes(6).toString('hex'));
  const backupDir=path.join(op,'backups'),receipt=path.join(op,'receipt.json'),recoveryPlan=path.join(op,'plan.json'),latest=path.join(plan.transactionRoot,'latest.json');
  try{fs.mkdirSync(op,{mode:0o700});}catch(e){fs.rmdirSync(lock);throw e;}
  const state={schema:'claude-pin-transaction/1',profile:plan.profile,version,pid:process.pid,startedAt:new Date().toISOString(),status:'running',settingsRestored:false,results:[],receipt,recoveryPlan};
  const journal=()=>{const body=JSON.stringify(state,null,2)+'\n';write(receipt,body,plan.home,backupDir);write(latest,body,plan.home,backupDir);};
  // The default profile (<home>/.claude) is addressed by HOME alone: naming it in
  // CLAUDE_CONFIG_DIR makes Claude Code create a stray <home>/.claude/.claude.json
  // beside the real <home>/.claude.json (B-220). Only another profile is named.
  const childEnv={...process.env,HOME:plan.home};
  if(plan.profile===require('./visibility-state').profilePath(path.join(plan.home,'.claude'))) delete childEnv.CLAUDE_CONFIG_DIR;
  else childEnv.CLAUDE_CONFIG_DIR=plan.profile;
  function cli(args,cwd=op) {
    state.command=args;state.cwd=cwd===op?undefined:cwd;journal();
    // A local scope is addressed by running in its project; PWD follows the cwd.
    const env=cwd===op?childEnv:{...childEnv,PWD:cwd};
    const r=runner('claude',args,{cwd,env,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
    if(r.status===null || r.signal || r.error) {state.uncertain=true;throw Error('native Claude command outcome is uncertain; inspect the transaction receipt before recovery');}
    verifyForeign(plan);
    if(r.status!==0) throw Error('native Claude command failed with exit '+(r.status===null?'unknown':r.status));
  }
  let target,settingsTouched=false,result;
  try {
    // All backups precede the first native action; they are retained in this
    // operation's private directory, never in Claude's plugin scan paths.
    state.backups=[plan.settingsFile,plan.registryFile,plan.knownFile,...plan.jobs.map(j=>j.file)].map(f=>protect(f,plan.home,backupDir));
    write(recoveryPlan,JSON.stringify({schema:'claude-pin-recovery/1',fingerprint:plan.fingerprint,
      jobs:plan.jobs.map(j=>({member:j.name,pluginInstall:j.pluginInstall,action:j.action,catalogFile:j.file,
        desired:{commit:j.row.commit,version:j.row.version,pluginPath:j.row.pluginPath,files:j.row.files},
        previous:j.old?{commit:j.old.gitCommitSha||null,version:j.old.version,files:j.oldFiles}:null,
        scopes:j.targets,aliases:(j.aliases||[]).map(x=>({projectPath:x.projectPath,real:x.real})),
        repairEligible:j.repairEligible}))},null,2)+'\n',plan.home,backupDir);
    target=targetSettings(plan);journal();
    for(const j of plan.jobs) write(j.file,j.catalog,plan.home,backupDir);
    write(plan.settingsFile,target,plan.home,backupDir,plan.settings.exists?plan.settings.text:null);
    settingsTouched=true;
    for(const j of plan.jobs) {
      state.current=j.pluginInstall;state.phase='catalog';journal();
      let payloadMutation=false;
      try {
        cli(['plugin','marketplace','add',j.dir]);
        restoreSettings(plan,target,backupDir);
        if(j.action==='reinstall') {admitUninstall(plan,j);state.phase='reinstall';journal();payloadMutation=true;cli(['plugin','uninstall',j.pluginInstall,'--scope','user','--keep-data']);}
        if(j.action==='install' || j.action==='reinstall') {payloadMutation=true;cli(['plugin','install',j.pluginInstall,'--scope','user']);}
        else if(j.action==='update') {
          for(const t of j.targets) {
            if(t.exact) continue;
            const before=records(plan,j);payloadMutation=true;state.phase='update:'+(t.projectPath||t.scope);
            cli(['plugin','update',j.pluginInstall,'--scope',t.scope],t.projectPath||op);
            readScope(plan,j,t,before,j.row);
          }
        }
        restoreSettings(plan,target,backupDir);
        const files=verify(plan,j);state.results.push({member:j.name,action:j.action,status:'verified',commit:j.row.commit,files});journal();
      } catch(e) {
        const failure={member:j.name,action:j.action,status:'failed',reason:e.message,rollback:'not-attempted'};
        // A supported prior Git source can be restored by native commands. A
        // failed rollback stays explicit; no installed-registry/cache edits.
        if(!state.uncertain && payloadMutation && j.old && /^[a-f0-9]{40}$/.test(j.old.gitCommitSha||'') && j.action!=='verify') {
          try {
            state.phase='rollback';journal();
            const oldRow={...j.row,version:j.old.version,commit:j.old.gitCommitSha};
            write(j.file,JSON.stringify(S.catalog(oldRow),null,2)+'\n',plan.home,backupDir);
            cli(['plugin','marketplace','update',j.marketplace]);
            if(j.targets.length!==1 || j.targets[0].scope!=='user') {
              // Several scopes: only a scope that moved goes back, by a native update
              // to the prior catalog (a downgrade is a version change, measured).
              for(const t of j.targets) {
                if(t.exact) continue;
                const now=records(plan,j).find(r=>r.scope===t.scope && (t.scope==='user' || r.projectPath===t.projectPath));
                if(now && now.version===oldRow.version && now.gitCommitSha===oldRow.commit) continue;
                const before=records(plan,j);cli(['plugin','update',j.pluginInstall,'--scope',t.scope],t.projectPath||op);readScope(plan,j,t,before,oldRow);
              }
            } else {
              const reg=P.parseMetadata(fs.readFileSync(plan.registryFile,'utf8')).data;
              const now=reg.plugins?.[j.pluginInstall];
              if(now?.length && now[0].version===j.old.version && !j.repairEligible) throw Error('rollback cannot uninstall configured plugin');
              if(now?.length && now[0].version===j.old.version) {admitUninstall(plan,j);cli(['plugin','uninstall',j.pluginInstall,'--scope','user','--keep-data']);}
              const again=P.parseMetadata(fs.readFileSync(plan.registryFile,'utf8')).data.plugins?.[j.pluginInstall];
              cli(['plugin',again?.length?'update':'install',j.pluginInstall,'--scope','user']);
            }
            verify(plan,j,oldRow,j.oldFiles);failure.rollback='verified-prior-payload';
          } catch(_) {failure.rollback='failed; native recovery remains required';}
        }
        state.results.push(failure);throw e;
      }
    }
    verifyForeign(plan);
    state.status='complete';state.settingsRestored=true;state.phase='verified';journal();
    return result={ok:true,receipt,results:state.results};
  } catch(e) {
    if(state.uncertain) state.settingsRestored=false;
    else if(settingsTouched) {try{restoreSettings(plan,target,backupDir);state.settingsRestored=true;}catch(_) {state.settingsRestored=false;}}
    else state.settingsRestored=text(plan.settingsFile)===(plan.settings.exists?plan.settings.text:null);
    state.status='failed';state.error=e.message;
    try{journal();}catch(_) {}
    return result={ok:false,receipt,error:e.message,results:state.results};
  } finally {
    // Retention never fails the transaction; what it did, or why not, rides on the result.
    if(result) {try {result.retention=retire(plan.transactionRoot,plan.home);} catch(e) {result.retention={error:e.message};}}
    fs.rmdirSync(lock);
  }
}
module.exports={execute,retire,KEEP_FINISHED,runtime,verify,targetSettings,restoreSettings,normalizedForeign,verifyForeign};
