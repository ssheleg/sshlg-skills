'use strict';
// Exact pinned-tree inventory. Native installation consumes this shipped data;
// it never substitutes a moving marketplace version for the committed source.
const crypto=require('crypto'),fs=require('fs'),path=require('path');
const {spawnSync}=require('child_process');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=p=>typeof p==='string' && p.length>0 && !p.startsWith('/') && !/[\\\x00-\x1f]/.test(p) && p.split('/').every(x=>x && x!=='.' && x!=='..');
function pluginPath(member,catalog) {
  if(typeof member.pluginInstall!=='string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*@[A-Za-z0-9][A-Za-z0-9._-]*$/.test(member.pluginInstall) || member.pluginInstall.includes('..')) throw Error('invalid pinned plugin identity');
  const [name,marketplace]=member.pluginInstall.split('@');
  if(!name || !marketplace || catalog.name!==marketplace || !Array.isArray(catalog.plugins)) throw Error('pinned marketplace identity mismatch');
  const entries=catalog.plugins.filter(p=>p.name===name);
  if(entries.length!==1) throw Error('pinned plugin entry missing or ambiguous');
  const source=entries[0].source;
  if(typeof source!=='string' || !source.startsWith('./') || !safe(source.slice(2))) throw Error('unsupported pinned plugin source; requires contained relative path');
  return source.slice(2);
}
function git(repo,args) {
  const r=spawnSync('git',['-C',repo,...args],{maxBuffer:32*1024*1024});
  if(r.status!==0) throw Error('cannot read exact pinned Git object: '+args[0]);
  return r.stdout;
}
function configSurface(value) {
  return Array.isArray(value)?value.some(configSurface):value && typeof value==='object'?Object.keys(value).some(k=>k==='userConfig' || k==='user_config' || configSurface(value[k])):typeof value==='string' && /\.(mcpb|dxt)(?:$|[?#])/i.test(value);
}
function generate(members,sourceRoot) {
  require('./installer-pins').validate(members);
  return {schema:'claude-plugin-pins/1',members:members.map(m=>{
    if(!safe(m.dir)) throw Error('invalid member source path');
    const repo=path.join(sourceRoot,m.dir);
    if(!fs.existsSync(path.join(repo,'.git'))) throw Error(m.name+': pinned member checkout is unavailable; use --source-root');
    const catalog=JSON.parse(git(repo,['show',m.commit+':.claude-plugin/marketplace.json']));
    const plugin=pluginPath(m,catalog);
    const manifest=JSON.parse(git(repo,['show',m.commit+':'+plugin+'/.claude-plugin/plugin.json']));
    if(manifest.name!==m.pluginInstall.split('@')[0] || manifest.version!==m.version) throw Error(m.name+': pinned plugin manifest identity/version mismatch');
    const files=[];
    for(const row of git(repo,['ls-tree','-rz',m.commit,'--',plugin+'/']).toString().split('\0').filter(Boolean)) {
      const split=row.indexOf('\t'),[mode,type,oid]=row.slice(0,split).split(' '),full=row.slice(split+1);
      if(type!=='blob' || !['100644','100755'].includes(mode) || !full.startsWith(plugin+'/')) throw Error(m.name+': unsupported pinned payload entry');
      const file=full.slice(plugin.length+1);
      if(!safe(file)) throw Error('unsafe pinned payload path');
      const b=git(repo,['cat-file','blob',oid]);files.push({path:file,sha256:sha256(b),bytes:b.length});
    }
    files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
    if(!files.some(f=>f.path==='.claude-plugin/plugin.json')) throw Error('empty pinned plugin payload');
    return {name:m.name,repo:m.repo,commit:m.commit,version:m.version,pluginInstall:m.pluginInstall,pluginPath:plugin,entry:catalog.plugins.find(p=>p.name===manifest.name),
      configSurface:configSurface(manifest) || configSurface(catalog.plugins.find(p=>p.name===manifest.name)) || files.some(f=>/\.(mcpb|dxt)$/i.test(f.path)),files};
  })};
}
function validate(inventory,members) {
  require('./installer-pins').validate(members);
  for(const m of members) {if(typeof m.version!=='string' || !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(m.version)) throw Error('invalid pinned plugin version');pluginPath(m,{name:m.pluginInstall?.split('@')[1],plugins:[{name:m.pluginInstall?.split('@')[0],source:'./probe'}]});}
  if(!inventory || inventory.schema!=='claude-plugin-pins/1' || !Array.isArray(inventory.members)) throw Error('invalid Claude pin inventory');
  const seen=new Set();
  for(const row of inventory.members) {
    if(!row || seen.has(row.name)) throw Error('duplicate Claude pin entry');seen.add(row.name);
    if(!row.entry || row.entry.name!==row.pluginInstall.split('@')[0] || row.entry.source!=='./'+row.pluginPath) throw Error('pinned plugin entry differs from source path');
    if(!safe(row.pluginPath) || typeof row.configSurface!=='boolean' || !Array.isArray(row.files) || !row.files.length) throw Error('invalid Claude pinned source');
    const paths=new Set();
    for(const f of row.files) {
      if(!safe(f.path) || paths.has(f.path) || !/^[a-f0-9]{64}$/.test(f.sha256) || !Number.isSafeInteger(f.bytes) || f.bytes<0) throw Error('invalid Claude payload inventory');
      paths.add(f.path);
    }
    if(!paths.has('.claude-plugin/plugin.json')) throw Error('missing pinned plugin manifest');
  }
  return members.map(m=>{
    const row=inventory.members.find(r=>r.name===m.name);
    if(!row || ['repo','commit','version','pluginInstall'].some(k=>row[k]!==m[k])) throw Error(m.name+': Claude pin inventory differs from committed member');
    return row;
  });
}
function catalog(row) {
  return {name:row.pluginInstall.split('@')[1],owner:{name:'ssheleg'},plugins:[{
    ...row.entry,name:row.pluginInstall.split('@')[0],source:{source:'git-subdir',url:'https://github.com/'+row.repo+'.git',path:row.pluginPath,sha:row.commit}}]};
}
function alive(pid) {
  // EPERM means the process exists under another user; only ESRCH proves it gone.
  try {process.kill(pid,0);return true;} catch(e) {return e.code!=='ESRCH';}
}
function snapshotPayload(root,pinned) {
  // `pinned`: the set of pinned paths. A bytecode cache is ignored only for a .pyc whose
  // source sits pinned beside it; it stays outside this readback either way.
  // `pinned === 'present'`: an installed payload being replaced, where a .pyc may
  // belong to its own (old) .py rather than to the new pin.
  const hasSource=pinned==='present'?rel=>{try {return fs.lstatSync(path.join(root,rel)).isFile();} catch(_) {return false;}}
    :(s=>rel=>s.has(rel))(pinned instanceof Set?pinned:new Set());
  const files=[];
  function walk(dir,rel='') {
    for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
      const name=rel?rel+'/'+e.name:e.name,full=path.join(dir,e.name);
      if(!rel && e.name==='.in_use') {
        if(!e.isDirectory()) throw Error('unexpected native lease-marker shape');
        for(const x of fs.readdirSync(full,{withFileTypes:true})) {
          if(x.isFile() && /^[0-9]+$/.test(x.name)) continue;
          // B-245: Claude writes `<pid>.tmp.<suffix>` and renames it to `<pid>`. A writer
          // that died mid-write leaves the temp file behind: residue, not payload.
          const t=x.isFile() && /^([0-9]+)\.tmp\.[A-Za-z0-9]+$/.exec(x.name);
          if(!t) throw Error('unexpected native lease-marker shape');
          if(alive(Number(t[1]))) throw Error('Claude lease marker in flight: pid '+t[1]+' is writing '+x.name+'; retry when it finishes');
        }
        continue;
      }
      // Python writes bytecode caches beside scripts that hooks run; they are
      // regenerated runtime artifacts, never pinned payload. Anything else there refuses.
      if(e.name==='__pycache__' && e.isDirectory()) {
        for(const x of fs.readdirSync(full,{withFileTypes:true})) {
          const m=/^([^.]+)\.[A-Za-z0-9_-]+(?:\.opt-\d+)?\.pyc$/.exec(x.name);
          if(!x.isFile() || !m || !hasSource((rel?rel+'/':'')+m[1]+'.py')) throw Error('unexpected bytecode-cache shape: '+name+'/'+x.name);
        }
        continue;
      }
      if(e.isDirectory()) walk(full,name);
      else if(e.isFile()) files.push(name);
      else throw Error('non-regular installed plugin payload');
    }
  }
  const s=fs.lstatSync(root);if(!s.isDirectory() || s.isSymbolicLink()) throw Error('invalid installed plugin root');
  walk(root);
  return files.sort().map(file=>{const b=fs.readFileSync(path.join(root,file));return {path:file,sha256:sha256(b),bytes:b.length};});
}
function verifyPayload(root,row) {
  const expected=new Map(row.files.map(f=>[f.path,f])),actual=snapshotPayload(root,new Set(expected.keys()));
  if(actual.length!==expected.size || actual.some(f=>!expected.has(f.path))) throw Error('installed plugin file inventory differs from pin');
  for(const f of actual) {const e=expected.get(f.path);if(f.bytes!==e.bytes || f.sha256!==e.sha256) throw Error('installed plugin bytes differ from pin: '+f.path);}
  return actual.length;
}
module.exports={pluginPath,generate,validate,catalog,verifyPayload,snapshotPayload,sha256,configSurface};
