'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const P=require('./claude-pinned'),S=require('./claude-plugin-source'),A=require('./apply'),J=require('./json-spans');
function text(file){try{return fs.readFileSync(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}}
function protect(file,home,dir){const r=A.protect(file,{home,backupDir:dir,keep:Infinity});if(r.action==='backup-failed')throw Error('Claude backup failed; no native action admitted');return r;}
function write(file,body,home,backupDir,expected=text(file)) {
  if(text(file)!==expected) throw Error('Claude file changed before protected write');
  protect(file,home,backupDir);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  if(text(file)!==expected) throw Error('Claude file changed during backup');
  fs.writeFileSync(file,body,{mode:0o600});
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
  if(current===null || normalizedForeign(J.parse(current).data,plan.jobs)!==normalizedForeign(plan.settings.data,plan.jobs)) throw Error('foreign Claude settings changed; preserving current file for recovery');
  write(plan.settingsFile,expected,plan.home,backupDir,current);
}
function verify(plan,job,row=job.row,files=row.files) {
  const registry=J.parse(fs.readFileSync(plan.registryFile,'utf8')).data;
  const records=registry.plugins?.[job.pluginInstall];
  if(!Array.isArray(records) || records.length!==1 || records[0].scope!=='user' || records[0].version!==row.version || records[0].gitCommitSha!==row.commit) throw Error(job.name+': native installed source readback differs from pin');
  const install=records[0].installPath;
  if(typeof install!=='string' || !require('./visibility-state').profilePath(install).startsWith(path.join(plan.profile,'plugins/cache')+path.sep)) throw Error('native installed root is outside expected cache');
  return S.verifyPayload(install,{files});
}
function admitUninstall(plan, job) {
  const records=J.parse(fs.readFileSync(plan.registryFile,'utf8')).data.plugins?.[job.pluginInstall];
  if(!Array.isArray(records) || records.length!==1 || records[0].scope!=='user') throw Error('native install scope changed before repair');
  const manifest=J.parse(fs.readFileSync(path.join(records[0].installPath,'.claude-plugin/plugin.json'),'utf8')).data;
  const settings=J.parse(fs.readFileSync(plan.settingsFile,'utf8')).data;
  if(!job.repairEligible || P.configured(manifest) || Object.prototype.hasOwnProperty.call(settings.pluginConfigs||{},job.pluginInstall)) throw Error('configured plugin repair refused before uninstall');
}
function runtime(runner=spawnSync) {
  const r=runner('claude',['--version'],{encoding:'utf8'});
  const m=/^2\.1\.(\d+)\b/.exec((r.stdout||'').trim());
  if(r.status!==0 || !m || Number(m[1])<296) throw Error('Claude native pin transaction requires verified CLI 2.1.296 or later in 2.1.x');
  return (r.stdout||'').trim();
}
function execute(planned,members,inventory,opts={}) {
  const plan=P.prepare(members,inventory,{home:planned.home,profileRoot:planned.profile});
  if(plan.fingerprint!==planned.fingerprint) throw Error('Claude pin plan changed; preview again before any mutation');
  const runner=opts.runner||spawnSync;
  const version=runtime(runner);
  fs.mkdirSync(plan.transactionRoot,{recursive:true,mode:0o700});
  const lock=path.join(plan.transactionRoot,'lock');fs.mkdirSync(lock,{mode:0o700});
  const op=path.join(plan.transactionRoot,Date.now()+'-'+crypto.randomBytes(6).toString('hex'));
  const backupDir=path.join(op,'backups'),receipt=path.join(op,'receipt.json'),latest=path.join(plan.transactionRoot,'latest.json');
  try{fs.mkdirSync(op,{mode:0o700});}catch(e){fs.rmdirSync(lock);throw e;}
  const state={schema:'claude-pin-transaction/1',profile:plan.profile,version,status:'running',settingsRestored:false,results:[],receipt};
  const journal=()=>{const body=JSON.stringify(state,null,2)+'\n';write(receipt,body,plan.home,backupDir);write(latest,body,plan.home,backupDir);};
  function cli(args) {
    state.command=args;journal();
    const r=runner('claude',args,{cwd:op,env:{...process.env,HOME:plan.home,CLAUDE_CONFIG_DIR:plan.profile},encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
    if(r.status!==0) throw Error('native Claude command failed with exit '+(r.status===null?'unknown':r.status));
  }
  let target;
  try {
    // All backups precede the first native action; they are retained in this
    // operation's private directory, never in Claude's plugin scan paths.
    state.backups=[plan.settingsFile,plan.registryFile,plan.knownFile,...plan.jobs.map(j=>j.file)].map(f=>protect(f,plan.home,backupDir));
    target=targetSettings(plan);journal();
    for(const j of plan.jobs) write(j.file,j.catalog,plan.home,backupDir);
    write(plan.settingsFile,target,plan.home,backupDir,plan.settings.exists?plan.settings.text:null);
    for(const j of plan.jobs) {
      state.current=j.pluginInstall;state.phase='catalog';journal();
      let payloadMutation=false;
      try {
        cli(['plugin','marketplace','add',j.dir]);
        restoreSettings(plan,target,backupDir);
        if(j.action==='reinstall') {admitUninstall(plan,j);state.phase='reinstall';journal();payloadMutation=true;cli(['plugin','uninstall',j.pluginInstall,'--scope','user','--keep-data']);}
        if(j.action==='install' || j.action==='reinstall') {payloadMutation=true;cli(['plugin','install',j.pluginInstall,'--scope','user']);}
        else if(j.action==='update') {payloadMutation=true;cli(['plugin','update',j.pluginInstall,'--scope','user']);}
        restoreSettings(plan,target,backupDir);
        const files=verify(plan,j);state.results.push({member:j.name,action:j.action,status:'verified',commit:j.row.commit,files});journal();
      } catch(e) {
        const failure={member:j.name,action:j.action,status:'failed',reason:e.message,rollback:'not-attempted'};
        // A supported prior Git source can be restored by native commands. A
        // failed rollback stays explicit; no installed-registry/cache edits.
        if(payloadMutation && j.old && /^[a-f0-9]{40}$/.test(j.old.gitCommitSha||'') && j.action!=='verify') {
          try {
            state.phase='rollback';journal();
            const oldRow={...j.row,version:j.old.version,commit:j.old.gitCommitSha};
            write(j.file,JSON.stringify(S.catalog(oldRow),null,2)+'\n',plan.home,backupDir);
            cli(['plugin','marketplace','update',j.marketplace]);
            const reg=J.parse(fs.readFileSync(plan.registryFile,'utf8')).data;
            const now=reg.plugins?.[j.pluginInstall];
            if(now?.length && now[0].version===j.old.version && !j.repairEligible) throw Error('rollback cannot uninstall configured plugin');
            if(now?.length && now[0].version===j.old.version) {admitUninstall(plan,j);cli(['plugin','uninstall',j.pluginInstall,'--scope','user','--keep-data']);}
            const again=J.parse(fs.readFileSync(plan.registryFile,'utf8')).data.plugins?.[j.pluginInstall];
            cli(['plugin',again?.length?'update':'install',j.pluginInstall,'--scope','user']);
            verify(plan,j,oldRow,j.oldFiles);failure.rollback='verified-prior-payload';
          } catch(_) {failure.rollback='failed; native recovery remains required';}
        }
        state.results.push(failure);throw e;
      }
    }
    state.status='complete';state.settingsRestored=true;state.phase='verified';journal();
    return {ok:true,receipt,results:state.results};
  } catch(e) {
    if(target) {try{restoreSettings(plan,target,backupDir);state.settingsRestored=true;}catch(_) {state.settingsRestored=false;}}
    state.status='failed';state.error=e.message;
    try{journal();}catch(_) {}
    return {ok:false,receipt,error:e.message,results:state.results};
  } finally {fs.rmdirSync(lock);}
}
module.exports={execute,runtime,verify,targetSettings,restoreSettings,normalizedForeign};
