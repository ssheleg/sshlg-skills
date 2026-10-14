'use strict';
// Read source from the supplied checkout; every mutation is in a cleaned fixture.
const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),assert=require('assert');
const source=path.resolve(process.argv[2]);let n=0;
for(const mode of ['install','update','native-failure','corrupt-rule']){
 const h=fs.mkdtempSync(path.join(os.tmpdir(),'owned-w175-b187-peer-'));
 try{
  const pkg=path.join(h,'package');fs.mkdirSync(pkg);
  for(const d of ['lib','bin','hooks'])fs.cpSync(path.join(source,d),path.join(pkg,d),{recursive:true});
  for(const file of fs.readdirSync(source).filter(f=>f.endsWith('.json')))fs.copyFileSync(path.join(source,file),path.join(pkg,file));
  const env={...process.env,HOME:h};for(const k of ['CLAUDE_CONFIG_DIR','CODEX_HOME','GEMINI_CONFIG_DIR','PI_CODING_AGENT_DIR','NODE_OPTIONS'])delete env[k];
  fs.mkdirSync(path.join(h,'.claude'));const target=path.join(h,'.claude','CLAUDE.md');
  // Existing router opt-out is fixture input, not a blanket ban on router behavior.
  const original='FOREIGN\n\n<!-- SSHLG:ROUTERS:OPTOUT -->\n';fs.writeFileSync(target,original);
  const marker=path.join(h,'native-called'),shim=path.join(h,'native-boundary.cjs');
  fs.writeFileSync(shim,`const T=require(${JSON.stringify(path.join(pkg,'lib/claude-pin-transaction'))});T.execute=()=>{require('fs').appendFileSync(${JSON.stringify(marker)},'called\\n');return {ok:${mode!=='native-failure'},receipt:'synthetic-only',results:[]};};`);
  const run=args=>cp.spawnSync(process.execPath,[path.join(pkg,'bin/sshlg-skills.js'),...args],{env,cwd:pkg,encoding:'utf8',timeout:30000});
  const ok=r=>assert.equal(r.status,0,r.stdout+r.stderr);
  ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--claude-only']));const owned=fs.readFileSync(target,'utf8');
  ok(run(['config','set','rules.wait','off']));env.NODE_OPTIONS='--require='+shim;
  if(mode==='corrupt-rule')fs.writeFileSync(path.join(h,'.sshlg-skills','wait-rules.json'),'{bad');
  if(['install','update'].includes(mode)){
   const preview=run([mode,'--claude-only','--dry-run']);ok(preview);assert(preview.stdout.includes('claude-pins'));assert(preview.stdout.includes('working-rule'));assert(!fs.existsSync(marker));assert.equal(fs.readFileSync(target,'utf8'),owned);
   const result=run([mode,'--claude-only']);ok(result);assert(fs.existsSync(marker));assert.equal(fs.readFileSync(target,'utf8'),original);assert(result.stdout.includes('rules.wait: claude remove'));
  }else{
   const result=run(['update','--claude-only']);assert.notEqual(result.status,0);assert.equal(fs.readFileSync(target,'utf8'),owned);assert.equal(fs.existsSync(marker),mode==='native-failure');
  }
  console.log('PASS '+mode);n++;
 }finally{fs.rmSync(h,{recursive:true,force:true});}
}
console.log('PASS independent merged native/wait composition: '+n+' cases');
