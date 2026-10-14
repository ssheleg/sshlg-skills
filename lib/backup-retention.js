'use strict';
// Retention references prevent pruning. Only the existing owner receipt can
// authorize/classify an operation; this metadata grants neither consent nor restore.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),J=require('./json-spans');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const PREFIX='.retain-',LOCK='.retention.lock';
const monotonic=()=>require('perf_hooks').performance.now();
function privateStat(file,directory=false){
 const s=fs.lstatSync(file);
 if(s.isSymbolicLink() || !(directory?s.isDirectory():s.isFile()) || (s.mode&0o077) || (typeof process.getuid==='function'&&s.uid!==process.getuid()))throw Error('backup retention storage is not private and owned');
 return s;
}
function owner(value){
 if(!value || Object.keys(value).sort().join(',')!=='operation,owner,receipt' || value.owner!=='wait-rules' || !/^[a-f0-9]{32}$/.test(value.operation) || typeof value.receipt!=='string' || !path.isAbsolute(value.receipt))throw Error('unknown backup retention owner binding');
 // First adapter uses an existing, regular private receipt, never an executable locator.
 privateStat(value.receipt);
 if(fs.realpathSync.native(value.receipt)!==value.receipt)throw Error('retention owner receipt must be canonical');
 return value;
}
function locked(dir,fn){
 privateStat(dir,true);
 const lock=path.join(dir,LOCK),deadline=monotonic()+5000;let fd;
 while(fd===undefined){try{fd=fs.openSync(lock,'wx',0o600);}catch(e){if(e.code!=='EEXIST')throw e;
  // The holder may release between our EEXIST and this inspection: retry the claim.
  try{privateStat(lock);}catch(gone){if(gone.code==='ENOENT')continue;throw gone;}
  if(monotonic()>=deadline)throw Error('backup retention lock is held; no stale-owner inference');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}}
 const own=fs.fstatSync(fd);
 try{return fn();}finally{fs.closeSync(fd);try{const now=fs.lstatSync(lock);if(now.dev===own.dev&&now.ino===own.ino)fs.unlinkSync(lock);}catch(e){if(e.code!=='ENOENT')throw e;}}
}
function read(file){
 privateStat(file);
 const raw=fs.readFileSync(file),text=raw.toString('utf8');if(!Buffer.from(text).equals(raw))throw Error('retention reference is not lossless UTF-8');
 const d=J.parse(text).data;
 if(!d||Object.keys(d).sort().join(',')!=='backup,operation,owner,receipt,schema,sha256,target' || d.schema!=='backup-retention/1' || d.owner!=='wait-rules' || !/^[a-f0-9]{32}$/.test(d.operation) || typeof d.receipt!=='string' || !path.isAbsolute(d.receipt) || typeof d.target!=='string' || !path.isAbsolute(d.target) || !/^[a-f0-9]{64}$/.test(d.sha256) || typeof d.backup!=='string' || path.basename(d.backup)!==d.backup || !/^.+--v2-[a-f0-9]{64}\.\d{8}T\d{6}Z(?:-\d+)?$/.test(d.backup))throw Error('unknown backup retention reference');
 if(!d.backup.includes('--v2-'+hash(d.target)+'.'))throw Error('retention backup name differs from canonical target');
 if(path.basename(file)!==PREFIX+hash(raw)+'.json')throw Error('retention reference content differs from identity');
 return d;
}
function references(dir){
 const result=[];
 for(const n of fs.readdirSync(dir))if(n.startsWith(PREFIX)){const file=path.join(dir,n);result.push({file,...read(file)});}
 return result;
}
// Called under the backup lock, before publication. Any orphan remains protective.
function reserve(dir,backup,target,bytes,binding){
 owner(binding);
 const d={schema:'backup-retention/1',...binding,target,backup:path.basename(backup),sha256:hash(bytes)};
 const body=Buffer.from(JSON.stringify(d)+'\n'),file=path.join(dir,PREFIX+hash(body)+'.json');
 let fd;
 try{fd=fs.openSync(file,'wx',0o600);fs.writeFileSync(fd,body);fs.fsyncSync(fd);}catch(e){if(e.code!=='EEXIST')throw e;read(file);if(!fs.readFileSync(file).equals(body))throw Error('retention collision');}finally{if(fd!==undefined)fs.closeSync(fd);}
 if(!fs.readFileSync(file).equals(body))throw Error('retention reference write readback differs');
 return {file,...d};
}
function verify(reference){
 const d=read(reference.file);
 for(const k of Object.keys(d))if(d[k]!==reference[k])throw Error('retention reference binding differs');
 const file=path.join(path.dirname(reference.file),d.backup);privateStat(file);
 if(hash(fs.readFileSync(file))!==d.sha256)throw Error('retained backup bytes changed');
 return d;
}
function retired(reference){
 try{fs.lstatSync(reference.file);return false;}catch(e){if(e.code!=='ENOENT')throw e;}
 const file=path.join(path.dirname(reference.file),'.released-'+path.basename(reference.file).slice(PREFIX.length));
 try{privateStat(file);}catch(e){if(e.code==='ENOENT')return false;throw e;}
 const bytes=fs.readFileSync(file);
 if(PREFIX+hash(bytes)+'.json'!==path.basename(reference.file))throw Error('retired reference identity differs');
 return true;
}
function releaseWait(reference){
 const proof=require('./wait-recovery').terminalProof(reference);
 const dir=path.dirname(reference.file);
 return locked(dir,()=>{
  if(retired(reference))return false;
  verify(reference);
  if(hash(fs.readFileSync(reference.receipt))!==proof.receiptSha256||fs.realpathSync.native(proof.root)!==proof.canonicalRoot)throw Error('wait terminal receipt or profile changed before retention release');
  const W=require('./wait-recovery'),P=require('./wait-rule-policy');
  if(!W.same(W.fingerprint(P.snapshot(proof.target)),proof.desired))throw Error('wait target changed before retention release');
  const dest=path.join(dir,'.released-'+path.basename(reference.file).slice(PREFIX.length));
  // Preserve a content-bound retirement proof; no stale reference deletion.
  try{fs.linkSync(reference.file,dest);}catch(e){if(e.code!=='EEXIST')throw e;privateStat(dest);if(!fs.readFileSync(dest).equals(fs.readFileSync(reference.file)))throw Error('retirement destination is foreign');}
  if(!fs.readFileSync(dest).equals(fs.readFileSync(reference.file)))throw Error('retention retirement readback differs');
  fs.unlinkSync(reference.file);
  return true;
 });
}
module.exports={privateStat,owner,locked,references,reserve,verify,read,retired,releaseWait};
