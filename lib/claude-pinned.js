'use strict';
// Native user-scope installation only. Planning reads metadata, never secrets;
// execution uses Claude's CLI and protected settings writes, not cache surgery.
const fs=require('fs'),path=require('path');
const Source=require('./claude-plugin-source'),J=require('./json-spans'),Bindings=require('./visibility-state');
const plain=x=>x && typeof x==='object' && !Array.isArray(x);
// Claude itself parses/serializes JSON numbers. Admit only numeric values whose
// exact decimal value survives that round trip; never compare colliding values
// after Number has rounded them. Strings are skipped as complete JSON tokens.
function decimal(raw) {
  const sign=raw.startsWith('-')?'-':'';
  const [mantissa,exp='0']=raw.replace(/^-/, '').toLowerCase().split('e');
  const [integer,fraction='']=mantissa.split('.');
  let digits=(integer+fraction).replace(/^0+/,''),power=BigInt(exp)-BigInt(fraction.length);
  if(!digits) return sign+'0';
  while(digits.endsWith('0')) {digits=digits.slice(0,-1);power++;}
  return sign+digits+'e'+power;
}
function parseMetadata(text) {
  let parsed;try{parsed=J.parse(text);}catch(_){throw Error('cannot parse native Claude metadata');}
  const tokens=/"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  for(const match of text.matchAll(tokens)) {
    const raw=match[0];if(raw.startsWith('"'))continue;
    const value=Number(raw);
    if(raw.length>128 || !Number.isFinite(value) || decimal(raw)!==decimal(JSON.stringify(value))) throw Error('native Claude metadata has a non-round-trip number; preserve original file before supported native update');
  }
  return parsed;
}
function read(file,fallback) {
  try {const stat=fs.lstatSync(file);if(!stat.isFile() || stat.isSymbolicLink()) throw Error('non-regular metadata');const text=fs.readFileSync(file,'utf8');return {text,data:parseMetadata(text).data,exists:true};}
  catch(e) {if(e.code==='ENOENT') return {text:fallback,data:J.parse(fallback).data,exists:false};throw Error('cannot admit native Claude metadata: '+path.basename(file)+(e.message.startsWith('native Claude metadata has a non-round-trip')?'; non-round-trip number is outside the supported native update':''));}
}
function editAt(text,keys,value) {
  const parsed=J.parse(text);let node=parsed.root;
  for(let i=0;i<keys.length-1;i++) {
    let entry=node.props && node.props.find(p=>p.key===keys[i]);
    if(!entry) return editAt(J.edit(text,node,keys[i],{}),keys,value);
    if(!entry.value.props) throw Error('native Claude settings field is not an object');
    node=entry.value;
  }
  return J.edit(text,node,keys[keys.length-1],value);
}
function ownedSource(source,row,dir) {
  if(!plain(source)) return false;
  if(source.source==='github') return source.repo===row.repo;
  if(source.source==='git') return ['https://github.com/'+row.repo+'.git','https://github.com/'+row.repo].includes(source.url);
  return source.source==='directory' && typeof source.path==='string' && path.resolve(source.path)===path.resolve(dir);
}
function configured(manifest) {
  if(!plain(manifest)) return true;
  const walk=v=>plain(v)?Object.keys(v).some(k=>k==='userConfig' || k==='user_config' || walk(v[k])):Array.isArray(v)?v.some(walk):typeof v==='string' && /\.(mcpb|dxt)(?:$|[?#])/i.test(v);
  return walk(manifest);
}
function prepare(members,inventory,opts) {
  const requested={profile:path.resolve(opts.profileRoot),home:path.resolve(opts.home)};
  const rows=Source.validate(inventory,members),profile=Bindings.profilePath(requested.profile),home=Bindings.profilePath(requested.home);
  const settingsFile=path.join(profile,'settings.json'),registryFile=path.join(profile,'plugins/installed_plugins.json'),knownFile=path.join(profile,'plugins/known_marketplaces.json');
  const settings=read(settingsFile,'{}'),registry=read(registryFile,'{"version":2,"plugins":{}}'),known=read(knownFile,'{}');
  if(!plain(settings.data) || !plain(registry.data) || !plain(registry.data.plugins) || !plain(known.data)) throw Error('invalid native Claude registry');
  for(const key of ['enabledPlugins','extraKnownMarketplaces','pluginConfigs']) if(key in settings.data && !plain(settings.data[key])) throw Error('invalid native Claude settings map: '+key);
  const transactionRoot=path.join(home,'.sshlg-skills/claude-pinned',Source.sha256(profile).slice(0,16),'transactions');
  const active=read(path.join(transactionRoot,'latest.json'),'null').data;
  if(fs.existsSync(path.join(transactionRoot,'lock')) || (active && (active.status==='running' || active.status==='failed' && (!active.settingsRestored || active.uncertain)))) throw Error('incomplete Claude transaction; inspect '+path.join(transactionRoot,'latest.json'));
  const jobs=[],equivalent=[];
  for(const row of rows) {
    const marketplace=row.pluginInstall.split('@')[1],dir=path.join(home,'.sshlg-skills/claude-pinned',Source.sha256(profile).slice(0,16),marketplace);
    const declaration=settings.data.extraKnownMarketplaces?.[marketplace];
    if(declaration && (!plain(declaration) || !ownedSource(declaration.source,row,dir))) throw Error(row.name+': conflicting marketplace declaration');
    if(known.data[marketplace] && !ownedSource(known.data[marketplace].source,row,dir)) throw Error(row.name+': conflicting known marketplace source');
    const existing=registry.data.plugins[row.pluginInstall];
    // Same version, pinned bytes already installed: nothing to deliver. A different
    // (docs-only) source commit or extra project/local scopes need no native mutation,
    // and a reinstall would rewrite a payload directory live sessions are using.
    const user=Array.isArray(existing)?existing.filter(r=>r&&r.scope==='user'):[];
    if(user.length===1 && user[0].version===row.version && typeof user[0].installPath==='string'
        && !(existing.length===1 && user[0].gitCommitSha===row.commit)
        && Bindings.profilePath(user[0].installPath).startsWith(path.join(profile,'plugins/cache')+path.sep)
        && existing.every(r=>r.installPath===user[0].installPath && r.version===row.version)) {
      let equal=false;try {equal=Source.verifyPayload(user[0].installPath,row)>=1;}catch(_) {}
      if(equal) {equivalent.push({name:row.name,pluginInstall:row.pluginInstall,version:row.version,pin:row.commit,installed:user[0].gitCommitSha||null,scopes:existing.length,files:row.files.length});continue;}
    }
    if(existing!==undefined && (!Array.isArray(existing) || existing.length!==1 || existing[0]?.scope!=='user')) throw Error(row.name+': native immutable repair supports one user-scope install only');
    for(const id of Object.keys(registry.data.plugins)) if(id.endsWith('@'+marketplace) && id!==row.pluginInstall) throw Error(row.name+': marketplace has another installed plugin');
    let action='install',old=null,oldFiles=null,repairEligible=false;
    if(existing) {
      old=existing[0];
      if(typeof old.installPath!=='string' || !path.isAbsolute(old.installPath) || typeof old.version!=='string') throw Error(row.name+': invalid installed plugin metadata');
      const cacheRoot=path.join(profile,'plugins/cache')+path.sep;
      if(!Bindings.profilePath(old.installPath).startsWith(cacheRoot)) throw Error(row.name+': installed payload is outside native cache');
      const st=fs.lstatSync(old.installPath);if(!st.isDirectory() || st.isSymbolicLink()) throw Error(row.name+': invalid installed plugin payload root');
      const manifest=read(path.join(old.installPath,'.claude-plugin/plugin.json'),'null');
      if(!manifest.exists || manifest.data?.name!==row.pluginInstall.split('@')[0]) throw Error(row.name+': unknown installed manifest');
      let exact=false;try {exact=old.version===row.version && old.gitCommitSha===row.commit && Source.verifyPayload(old.installPath,row)>=1;}catch(_) {}
      action=exact?'verify':old.version===row.version?'reinstall':'update';
      oldFiles=Source.snapshotPayload(old.installPath);
      if(action==='reinstall' && !/^[a-f0-9]{40}$/.test(old.gitCommitSha||'')) throw Error(row.name+': repair requires prior immutable Git identity');
      if(action==='reinstall' && (oldFiles.length!==row.files.length || oldFiles.some(f=>!row.files.some(p=>p.path===f.path)))) throw Error(row.name+': unknown same-version payload files; preserve before repair');
      repairEligible=!(row.configSurface || configured(manifest.data) || oldFiles.some(f=>/\.(mcpb|dxt)$/i.test(f.path)) || Object.prototype.hasOwnProperty.call(settings.data.pluginConfigs||{},row.pluginInstall));
      if(action==='reinstall' && !repairEligible) throw Error(row.name+': configured plugin repair is unsupported; options/data preserved');
    }
    if(row.configSurface && action==='install') throw Error(row.name+': configured native install is outside the verified contract');
    const file=path.join(dir,'.claude-plugin/marketplace.json'),catalog=JSON.stringify(Source.catalog(row),null,2)+'\n';
    // An existing hub-owned catalog must still belong to this exact member.
    if(!Bindings.profilePath(file).startsWith(home+path.sep)) throw Error(row.name+': managed catalog escapes home');
    const prior=read(file,'null');
    if(prior.exists) {
      const p=prior.data;
      if(!plain(p) || p.name!==marketplace || !Array.isArray(p.plugins) || p.plugins.length!==1 || p.plugins[0].name!==row.pluginInstall.split('@')[0] || p.plugins[0].source?.source!=='git-subdir' || p.plugins[0].source.url!=='https://github.com/'+row.repo+'.git') throw Error(row.name+': existing catalog is not owned by this member');
    }
    jobs.push({name:row.name,pluginInstall:row.pluginInstall,marketplace,dir,file,catalog,action,row,old,oldFiles,repairEligible});
  }
  const fingerprint=Source.sha256(JSON.stringify({equivalent,settings:settings.text,registry:registry.text,known:known.text,catalogs:jobs.map(j=>({text:read(j.file,'null').text,action:j.action,oldFiles:j.oldFiles})),inventory:rows,profile,home,bindings:[settingsFile,registryFile,knownFile,...jobs.map(j=>j.file)].map(Bindings.profilePath)}));
  return {fingerprint,requested,profile,home,settingsFile,registryFile,knownFile,settings,registry,known,jobs,equivalent,transactionRoot};
}
module.exports={prepare,editAt,ownedSource,configured,parseMetadata};
