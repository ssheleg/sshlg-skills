'use strict';
// Deterministic existing test seams, owned fixture only; no process is signalled.
const fs = require('fs'), path = require('path'), os = require('os');
const root = path.resolve(__dirname, '../../../..');
const lock = require(path.join(root, 'lib/updatelock.js'));
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'b190-prior-art-'));
let result;
try {
  const file = lock.lockPath(home); fs.mkdirSync(path.dirname(file), {recursive:true});
  const old = {pid:101, startedAt:1, host:'fixture'};
  const successor = {pid:202, startedAt:2, host:'fixture'};
  const third = {pid:303, startedAt:3, host:'fixture'};
  fs.writeFileSync(file, JSON.stringify(old));
  let switched = false;
  const attempt = lock.acquire(home, {
    pid:404, now:4, host:'fixture', alive:pid => pid !== 101,
    beforeTakeover:() => { if (!switched) { switched=true; fs.writeFileSync(file,JSON.stringify(successor)); } },
    linkSync:(grabbed,destination) => { fs.writeFileSync(destination,JSON.stringify(third),{flag:'wx'}); fs.linkSync(grabbed,destination); }
  });
  const current=JSON.parse(fs.readFileSync(file,'utf8'));
  result={schema:'update-lock-prior-art-probe/1',mechanism:'existing beforeTakeover/linkSync seams; not actual concurrent processes',attempt_ok:attempt.ok,current_pid:current.pid,successor202_still_has_path:current.pid===202,third303_retained:current.pid===303,remaining_takeovers:fs.readdirSync(path.dirname(file)).filter(x=>x.endsWith('.takeover')),conclusion:'The restore-EEXIST branch can discard a successor lock while a third token occupies the public name. Do not reuse as B190 exclusion proof.'};
  if(attempt.ok || current.pid!==303 || result.remaining_takeovers.length)throw Error('unexpected probe result');
} finally { fs.rmSync(home,{recursive:true,force:true}); }
result.owned_fixture_removed=!fs.existsSync(home);
process.stdout.write(JSON.stringify(result,null,2)+'\n');
