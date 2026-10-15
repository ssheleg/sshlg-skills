'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert');
const W=require('../lib/wait-rules'),P=require('../lib/wait-rule-policy');
let passed=0,failed=0;
// A journal left by a launcher that wrote wait-v1 (1.63.3) must recover under wait-v2 code.
for(const [cut,expected] of [['host-before','before'],['host-after','after'],['terminal-after','after']]){
 const home=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-wait-revcrash-')));
 try{
  fs.mkdirSync(path.join(home,'.codex'));const file=path.join(home,'.codex','AGENTS.md');fs.writeFileSync(file,'BEFORE');P.set(home,'on');
  const script=`const T=require(require('path').join(require('path').dirname(process.argv[1]),'wait-rule-text.js'));T.BODY=T.PREVIOUS['wait-v1'];T.REVISION='wait-v1';const fs=require('fs'),path=require('path'),W=require(process.argv[1]),P=require(process.argv[2]),A=require(process.argv[3]);const home=process.argv[4],cut=process.argv[5],file=path.join(home,'.codex','AGENTS.md');const crash=()=>process.kill(process.pid,'SIGKILL');let calls=0;const replace=P.replace;P.replace=(h,f,...args)=>{let name=f===file?'host':f===W.receiptPath(home)?['prepared','intent','terminal'][calls++]:'';if(cut===name+'-before')crash();const out=replace(h,f,...args);if(cut===name+'-after')crash();return out;};const link=fs.linkSync;fs.linkSync=(a,b)=>{const r=link(a,b);if(cut==='retired-link'&&b.includes('.released-'))crash();return r;};W.execute(W.plan(home,{env:{},cursor:false,hostTargets:A.TARGETS.filter(t=>t.agent==='codex')}));`;
  const child=cp.spawnSync(process.execPath,['-e',script,require.resolve('../lib/wait-rules'),require.resolve('../lib/wait-rule-policy'),require.resolve('../lib/apply'),home,cut],{encoding:'utf8',timeout:5000});
  assert.equal(child.signal,'SIGKILL',child.stderr);assert.equal(W.inspectRecovery(home).state,expected);
  if(['before','after'].includes(expected)){
   // Fixture-only owner lock reconciliation: the exact owned child is proven dead.
   // Production never steals stale locks or infers authority from a PID/timeout.
   fs.unlinkSync(W.receiptPath(home)+'.lock');
   if(cut==='retired-link'){
    const lock=path.join(home,'.sshlg-skills','backups','.retention.lock'),bytes=fs.readFileSync(W.receiptPath(home));
    assert.throws(()=>W.resolveRecovery(home),/retention lock is held/);assert(fs.existsSync(lock));assert.ok(fs.readFileSync(W.receiptPath(home)).equals(bytes));
    // Explicit reconciliation of this second fixture lock only. No production
    // retirement API exists; an unknown live owner remains RECOVERY_REQUIRED.
    fs.unlinkSync(lock);
   }
   assert.equal(W.resolveRecovery(home).state,expected==='before'?'recovered-no-write':'recovered-committed');
  }
  if(['none','unresolved','before'].includes(expected))assert.equal(fs.readFileSync(file,'utf8'),'BEFORE');
  passed++;console.log('ok wait-v1 journal recovered: '+cut);
 }catch(e){failed++;console.error('FAIL '+cut+': '+e.stack);}finally{fs.rmSync(home,{recursive:true,force:true});}
}
console.log(failed ? `FAIL: wait_recovery_revision — ${passed} passed; ${failed} failed` : `PASS: wait_recovery_revision — ${passed} cases`);process.exitCode=failed?1:0;
