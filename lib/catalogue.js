'use strict';
// Filesystem discovery is separate from native invocation. No host process is
// started here: cached and disabled skills remain readable, not implicitly enabled.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const apply = require('./apply');
const hostvis = require('./hostvis');

const { metadata } = require('./skillmeta');

function roots(home, env, warnings = []) {
  const entries=[{root:path.join(home,'.agents/skills'),host:'shared'}];
  for(const target of apply.TARGETS) entries.push({root:path.join(apply.hostRoot(target,home,{env}),'skills'),host:target.agent});
  for(const host of hostvis.hosts(home,env)) for(const root of host.roots||[]) entries.push({root,host:host.id});
  for(const dir of ['.cursor','.continue','.kimi','.kimi-code']) entries.push({root:path.join(home,dir,'skills'),host:dir.slice(1)});
  const claude = apply.hostRoot(apply.TARGETS.find(t => t.agent === 'claude'), home, {env});
  const registry = path.join(claude, 'plugins/installed_plugins.json');
  try {
    const plugins = JSON.parse(fs.readFileSync(registry, 'utf8')).plugins || {};
    for (const installs of Object.values(plugins)) if (Array.isArray(installs)) {
      for (const install of installs) if (install && typeof install.installPath === 'string')
        entries.push({root:path.join(install.installPath, 'skills'), host:'claude-installed'});
    }
  } catch (e) { if (e.code !== 'ENOENT') warnings.push(`${registry}: ${e.code || 'invalid JSON'}`); }
  const codex=apply.hostRoot(apply.TARGETS.find(t=>t.agent==='codex'),home,{env});
  // Codex caches have a fixed marketplace/plugin/version/skills layout. All cached
  // versions are search evidence; none proves which version this session loaded.
  const cache=path.join(codex,'plugins/cache');
  function dirs(p) {try{return fs.readdirSync(p,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();}catch(e){if(e.code!=='ENOENT')warnings.push(`${p}: ${e.code}`);return [];}}
  for(const market of dirs(cache)) for(const plugin of dirs(path.join(cache,market)))
    for(const version of dirs(path.join(cache,market,plugin)))
      entries.push({root:path.join(cache,market,plugin,version,'skills'),host:'codex-cache'});
  return entries.filter((e,i,a)=>a.findIndex(x=>x.root===e.root)===i);
}

function read(home, known, options) {
  const opts=options||{}, env=opts.env||process.env, seen=new Set(), visited=new Set(), out=[];
  out.warnings=[];
  for(const s of known||[]) if(s.path) {try{seen.add(fs.realpathSync(s.path));}catch(_){}}
  function visit(dir,host,depth) {
    let real;
    try{real=fs.realpathSync(dir);}catch(e){if(e.code!=='ENOENT')out.warnings.push(`${dir}: ${e.code}`);return;}
    if(visited.has(real))return; visited.add(real);
    const file=path.join(dir,'SKILL.md');
    try {
      const bytes=fs.readFileSync(file); const canonical=fs.realpathSync(file);
      if(seen.has(canonical))return; seen.add(canonical);
      const meta=metadata(bytes.toString('utf8'));
      out.push({plugin:`(${host} filesystem)`,id:meta.name||path.basename(dir),description:meta.description||'',
        callable:true,namespace:host==='shared'?'shared':`filesystem:${host}`,provenance:`${host}:${file}`,
        path:file,digest:crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16)});
      return;
    }catch(e){if(e.code!=='ENOENT'&&e.code!=='ENOTDIR'){out.warnings.push(`${file}: ${e.code}`);return;}}
    if(depth>=4){out.warnings.push(`${dir}: depth limit`);return;}
    let names;try{names=fs.readdirSync(dir,{withFileTypes:true});}catch(e){out.warnings.push(`${dir}: ${e.code}`);return;}
    for(const entry of names.sort((a,b)=>a.name.localeCompare(b.name))) {
      if(entry.name.startsWith('.')&&entry.name!=='.system')continue;
      if(['node_modules','references','scripts','assets','.git'].includes(entry.name))continue;
      if(entry.isDirectory()||entry.isSymbolicLink())visit(path.join(dir,entry.name),host,depth+1);
    }
  }
  for(const entry of roots(home,env,out.warnings))visit(entry.root,entry.host,0);
  return out;
}
module.exports={read,roots,metadata};
