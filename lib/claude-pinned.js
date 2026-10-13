'use strict';
// Native user-scope installation only. Planning reads metadata, never secrets;
// execution uses Claude's CLI and protected settings writes, not cache surgery.
const fs=require('fs'),path=require('path');
const Source=require('./claude-plugin-source'),J=require('./json-spans');
const plain=x=>x && typeof x==='object' && !Array.isArray(x);
function read(file,fallback) {
  try {const text=fs.readFileSync(file,'utf8');return {text,data:J.parse(text).data,exists:true};}
  catch(e) {if(e.code==='ENOENT') return {text:fallback,data:J.parse(fallback).data,exists:false};throw Error('cannot admit native Claude metadata: '+path.basename(file));}
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
  const rows=Source.validate(inventory,members),profile=path.resolve(opts.profileRoot),home=path.resolve(opts.home);
  const settingsFile=path.join(profile,'settings.json'),registryFile=path.join(profile,'plugins/installed_plugins.json'),knownFile=path.join(profile,'plugins/known_marketplaces.json');
  const settings=read(settingsFile,'{}'),registry=read(registryFile,'{"version":2,"plugins":{}}'),known=read(knownFile,'{}');
  if(!plain(settings.data) || !plain(registry.data) || !plain(registry.data.plugins) || !plain(known.data)) throw Error('invalid native Claude registry');
  for(const key of ['enabledPlugins','extraKnownMarketplaces','pluginConfigs']) if(key in settings.data && !plain(settings.data[key])) throw Error('invalid native Claude settings map: '+key);
  const jobs=[];
  for(const row of rows) {
    const marketplace=row.pluginInstall.split('@')[1],dir=path.join(home,'.sshlg-skills/claude-pinned',marketplace);
    const declaration=settings.data.extraKnownMarketplaces?.[marketplace];
    if(declaration && (!plain(declaration) || !ownedSource(declaration.source,row,dir))) throw Error(row.name+': conflicting marketplace declaration');
    if(known.data[marketplace] && !ownedSource(known.data[marketplace].source,row,dir)) throw Error(row.name+': conflicting known marketplace source');
    const existing=registry.data.plugins[row.pluginInstall];
    if(existing!==undefined && (!Array.isArray(existing) || existing.length!==1 || existing[0]?.scope!=='user')) throw Error(row.name+': native immutable repair supports one user-scope install only');
    for(const id of Object.keys(registry.data.plugins)) if(id.endsWith('@'+marketplace) && id!==row.pluginInstall) throw Error(row.name+': marketplace has another installed plugin');
    let action='install',old=null;
    if(existing) {
      old=existing[0];
      if(typeof old.installPath!=='string' || !path.isAbsolute(old.installPath) || typeof old.version!=='string') throw Error(row.name+': invalid installed plugin metadata');
      const st=fs.lstatSync(old.installPath);if(!st.isDirectory() || st.isSymbolicLink()) throw Error(row.name+': invalid installed plugin payload root');
      const manifest=read(path.join(old.installPath,'.claude-plugin/plugin.json'),'null');
      if(!manifest.exists || manifest.data?.name!==row.pluginInstall.split('@')[0]) throw Error(row.name+': unknown installed manifest');
      let exact=false;try {exact=old.gitCommitSha===row.commit && Source.verifyPayload(old.installPath,row)>=1;}catch(_) {}
      action=exact?'verify':old.version===row.version?'reinstall':'update';
      if(action==='reinstall' && (row.configSurface || configured(manifest.data) || Object.prototype.hasOwnProperty.call(settings.data.pluginConfigs||{},row.pluginInstall))) throw Error(row.name+': configured plugin repair is unsupported; options/data preserved');
    }
    const file=path.join(dir,'.claude-plugin/marketplace.json'),catalog=JSON.stringify(Source.catalog(row),null,2)+'\n';
    // An existing hub-owned catalog must still belong to this exact member.
    const prior=read(file,'null');
    if(prior.exists) {
      const p=prior.data;
      if(!plain(p) || p.name!==marketplace || !Array.isArray(p.plugins) || p.plugins.length!==1 || p.plugins[0].name!==row.pluginInstall.split('@')[0] || p.plugins[0].source?.source!=='git-subdir' || p.plugins[0].source.url!=='https://github.com/'+row.repo+'.git') throw Error(row.name+': existing catalog is not owned by this member');
    }
    jobs.push({name:row.name,pluginInstall:row.pluginInstall,marketplace,dir,file,catalog,action,row,old});
  }
  const fingerprint=Source.sha256(JSON.stringify({settings:settings.text,registry:registry.text,known:known.text,catalogs:jobs.map(j=>read(j.file,'null').text),inventory:rows,profile,home}));
  return {fingerprint,profile,home,settingsFile,registryFile,knownFile,settings,registry,known,jobs};
}
module.exports={prepare,editAt,ownedSource,configured};
