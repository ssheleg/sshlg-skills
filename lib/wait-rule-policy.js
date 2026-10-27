'use strict';
// Explicit working-rule policy: unlike routers, absence is OFF. Never recover
// corrupt/unknown consent as an empty object, or reserialize unrelated values.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const J = require('./json-spans.js');
const apply = require('./apply.js');
const atomic = require('./atomicwrite.js');
const config = require('./config.js');
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);

function snapshot(file) {
  let stat;
  try { stat = fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('working-rule file must be a regular non-symlink file');
  if (!(stat.mode & 0o444)) throw Error('working-rule file is unreadable');
  const bytes=fs.readFileSync(file), text=bytes.toString('utf8');
  if(!Buffer.from(text,'utf8').equals(bytes)) throw Error('working-rule file is not lossless UTF-8');
  return { text, mode: stat.mode & 0o777, dev: stat.dev, ino: stat.ino };
}
function same(a,b) { return a === null ? b === null : b !== null && a.text === b.text && a.mode === b.mode && a.dev === b.dev && a.ino === b.ino; }
function parse(text) {
  const parsed = J.parse(text);
  if (!object(parsed.data)) throw Error('working-rule policy must be a JSON object');
  if ('rules' in parsed.data && !object(parsed.data.rules)) throw Error('rules must be an object');
  const state = parsed.data.rules && parsed.data.rules.wait;
  if (state !== undefined && state !== 'on' && state !== 'off') throw Error('rules.wait must be on or off');
  return { ...parsed, enabled: state === 'on' };
}
function read(home) {
  const file = config.configPath(home), before = snapshot(file);
  return { file, before, ...parse(before === null ? '{}' : before.text) };
}
// Non-stealing admission: other config writers use the same lock name but have
// weaker stale-lock behavior. Compare-before-rename detects observed changes;
// this is not a filesystem CAS against arbitrary uncooperative writers.
function locked(file, fn) {
  const lock = file + '.lock';
  const fd = fs.openSync(lock, 'wx', 0o600), own = fs.fstatSync(fd);
  // The exclusive inode is the lock; no PID payload or stale-owner inference.
  try { return fn(); }
  finally {
    fs.closeSync(fd);
    try { const now=fs.lstatSync(lock); if(now.dev===own.dev && now.ino===own.ino) fs.unlinkSync(lock); } catch(e) { if(e.code!=='ENOENT') throw e; }
  }
}
function replace(home, file, before, text, validate = () => {}) {
  if (before && before.text === text) return false;
  validate();
  const parent = fs.realpathSync(path.dirname(file));
  if (!same(snapshot(file), before)) throw Error('working-rule file changed before backup');
  const saved=apply.protect(file,{home});
  if(saved.action==='backup-failed') throw Error('working-rule backup failed: '+saved.error);
  if (text === null) {
    if (fs.realpathSync(path.dirname(file))!==parent || !same(snapshot(file),before)) throw Error('working-rule file changed before removal');
    validate(); fs.unlinkSync(file);
    return true;
  }
  // B-260: the hub's one atomic writer; the re-checks stay between flush and rename.
  atomic.write(file, text, {
    mode: 0o600,
    tmpName: '.wait-rule-' + crypto.randomBytes(12).toString('hex') + '.tmp',
    beforeRename: (tmp) => {
      if (fs.readFileSync(tmp,'utf8')!==text) throw Error('working-rule temporary write was incomplete');
      if (fs.realpathSync(path.dirname(file))!==parent || !same(snapshot(file),before)) throw Error('working-rule file changed before replacement');
      validate();
    },
  });
  if (fs.readFileSync(file,'utf8')!==text) throw Error('working-rule write readback differs');
  return true;
}
function set(home,state) {
  if(state!=='on' && state!=='off') throw Error('rules.wait must be on or off');
  // Admission before mkdir or lock: damaged policy is never "fixed" implicitly.
  read(home);
  const file=config.configPath(home);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  return locked(file,()=>{
    const current=read(home);
    if (current.data.rules && current.data.rules.wait===state) return current;
    const raw=current.before===null?'{}\n':current.before.text;
    const prop=current.root.props.find(p=>p.key==='rules');
    const text=prop ? J.edit(raw,prop.value,'wait',state) : J.edit(raw,current.root,'rules',{wait:state});
    replace(home,file,current.before,text);
    return read(home);
  });
}
module.exports={read,set,parse,snapshot,same,locked,replace};
