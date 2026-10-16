'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const BIN=path.resolve(__dirname,'../bin/sshlg-skills.js');
let n=0,failed=0;
function test(name,fn){const home=fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-wait-cli-'));try{
 const env={...process.env,HOME:home};for(const k of ['CLAUDE_CONFIG_DIR','CODEX_HOME','GEMINI_CLI_HOME','PI_CODING_AGENT_DIR','NODE_OPTIONS'])delete env[k];
 const run=args=>cp.spawnSync(process.execPath,[BIN,...args],{env,encoding:'utf8',timeout:30000});
 fn(home,run,env);n++;console.log('ok '+name);
}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}finally{fs.rmSync(home,{recursive:true,force:true});}}
function ok(r){assert.equal(r.status,0,r.stdout+r.stderr);}
function host(h,dir,name){const d=path.join(h,dir);fs.mkdirSync(d,{recursive:true});const f=path.join(d,name);fs.writeFileSync(f,'USER TEXT\n');return f;}
test('config → preview → scoped apply → three repeated applies → off is exact', (h,run)=>{
 const c=host(h,'.claude','CLAUDE.md'),x=host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));
 const preview=run(['rules','--agent','codex']);ok(preview);assert(preview.stdout.includes('+ <!-- SSHLG:RULE:wait-is-not-a-stop:BEGIN -->'));assert.equal(fs.readFileSync(x,'utf8'),'USER TEXT\n');
 ok(run(['rules','--apply','--agent','codex']));const applied=fs.readFileSync(x,'utf8');for(let i=0;i<3;i++)ok(run(['rules','--apply','--agent','codex']));assert.equal(fs.readFileSync(x,'utf8'),applied);assert.equal(fs.readFileSync(c,'utf8'),'USER TEXT\n');
 ok(run(['config','set','rules.wait','off']));const off=run(['rules','--agent','codex']);ok(off);assert(off.stdout.includes('- <!-- SSHLG:RULE:wait-is-not-a-stop:BEGIN -->'));assert.equal(fs.readFileSync(x,'utf8'),applied);ok(run(['rules','--apply','--agent','codex']));assert.equal(fs.readFileSync(x,'utf8'),'USER TEXT\n');
});
test('--apply --dry-run changes neither host bytes nor ownership receipt',(h,run)=>{const f=host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--dry-run','--agent','codex']));assert.equal(fs.readFileSync(f,'utf8'),'USER TEXT\n');assert(!fs.existsSync(path.join(h,'.sshlg-skills','wait-rules.json')));});
test('member-only rule request is refused without host mutation',(h,run)=>{const f=host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));const r=run(['rules','--apply','--member','task-pipeline']);assert.notEqual(r.status,0);assert.equal(fs.readFileSync(f,'utf8'),'USER TEXT\n');});
test('update plan lists only previously applied targets and dry-run mutates nothing',(h,run)=>{const f=host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--agent','codex']));const before=fs.readFileSync(f,'utf8');host(h,'.gemini','GEMINI.md');const r=run(['update','--dry-run','--agent','codex']);ok(r);assert(r.stdout.includes('working-rule'));assert(r.stdout.includes('codex: unchanged'));assert(!r.stdout.includes('gemini: write'));assert.equal(fs.readFileSync(f,'utf8'),before);});
test('corrupt wait ownership fails update planning before any child',(h,run,env)=>{host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));fs.writeFileSync(path.join(h,'.sshlg-skills','wait-rules.json'),'{oops');const dir=path.join(h,'bin');fs.mkdirSync(dir);const marker=path.join(h,'child');fs.writeFileSync(path.join(dir,'npx'),'#!/bin/sh\ntouch "'+marker+'"\n',{mode:0o755});env.PATH=dir+':'+process.env.PATH;const r=run(['update','--agent','codex']);assert.notEqual(r.status,0);assert(!fs.existsSync(marker));});
function packaged(h,env){
 const root=path.join(h,'package'),source=path.resolve(__dirname,'..');fs.mkdirSync(root);
 for(const name of ['bin','lib','hooks'])fs.cpSync(path.join(source,name),path.join(root,name),{recursive:true});
 for(const name of fs.readdirSync(source).filter(n=>n.endsWith('.json')))fs.copyFileSync(path.join(source,name),path.join(root,name));
 const stubs=path.join(h,'stubs');fs.mkdirSync(stubs);const calls=path.join(h,'stub-calls');
 for(const name of ['npx','claude','codex','git'])fs.writeFileSync(path.join(stubs,name),`#!/bin/sh
printf '${name}\\n' >> '${calls}'
printf '{"installed":[]}\\n'
exit 0
`,{mode:0o755});
 env.PATH=stubs+':'+env.PATH;
 return args=>cp.spawnSync(process.execPath,[path.join(root,'bin','sshlg-skills.js'),...args],{env,cwd:root,encoding:'utf8',timeout:30000});
}
test('actual packaged update removes off-owned text and never adds a new host',(h,run,env)=>{
 const f=host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--agent','codex']));
 const g=host(h,'.gemini','GEMINI.md');ok(run(['config','set','rules.wait','off']));const r=packaged(h,env)(['update','--agent','codex']);ok(r);
 assert.equal(fs.readFileSync(f,'utf8'),'USER TEXT\n');assert.equal(fs.readFileSync(g,'utf8'),'USER TEXT\n');assert(r.stdout.includes('rules.wait: codex remove'));
});
test('member-only actual update leaves even malformed family rule state unread',(h,run,env)=>{
 const f=host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--agent','codex']));const before=fs.readFileSync(f,'utf8');
 fs.writeFileSync(path.join(h,'.sshlg-skills','wait-rules.json'),'{unknown');const r=packaged(h,env)(['update','--agent','codex','--member','task-pipeline']);ok(r);assert.equal(fs.readFileSync(f,'utf8'),before);assert(!r.stdout.includes('rules.wait:'));
});
test('actual packaged uninstall removes only selected owned wait text',(h,run,env)=>{
 const f=host(h,'.codex','AGENTS.md'),c=host(h,'.claude','CLAUDE.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply']));const before=fs.readFileSync(c,'utf8');
 const r=packaged(h,env)(['uninstall','--no-claude','--agent','codex']);ok(r);assert.equal(fs.readFileSync(f,'utf8'),'USER TEXT\n');assert.equal(fs.readFileSync(c,'utf8'),before);
});
const sha=f=>require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function intrude(f,line='OPERATOR RULE'){const B='<!-- SSHLG:RULE:wait-is-not-a-stop:BEGIN -->\n';const t=fs.readFileSync(f,'utf8').replace(B,B+line+'\n');fs.writeFileSync(f,t);return {text:t,line:t.split('\n').indexOf(line)+1};}
// B-201: one edited block used to abort every step on every host with the usage-error code.
test('foreign text inside one owned wait block refuses that block only: file:line named, other steps run, exit 1, three runs byte-identical',(h,run,env)=>{
 const x=host(h,'.codex','AGENTS.md'),g=host(h,'.gemini','GEMINI.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--agent','codex,gemini']));
 const {text,line}=intrude(x);const gBefore=fs.readFileSync(g,'utf8');
 const dry=run(['update','--dry-run','--no-claude']);assert.equal(dry.status,0,dry.stdout+dry.stderr);assert(dry.stdout.includes('codex: refused'),dry.stdout);assert(dry.stdout.includes(`${x}:${line}`),dry.stdout);assert.equal(fs.readFileSync(x,'utf8'),text);
 const up=packaged(h,env),hashes=[];
 for(let i=0;i<3;i++){
  const r=up(['update','--no-claude']);assert.equal(r.status,1,r.stdout+r.stderr);
  assert(r.stdout.includes(`rules.wait: codex refused — ${x}:${line}`),r.stdout);assert(/outside the markers/.test(r.stdout),r.stdout);
  assert(r.stdout.includes('rules.wait: gemini unchanged'),r.stdout);assert(r.stdout.includes('== Refreshing the routing block =='),r.stdout);
  hashes.push(sha(x));
 }
 assert.equal(fs.readFileSync(x,'utf8'),text);assert.equal(new Set(hashes).size,1);assert.equal(fs.readFileSync(g,'utf8'),gBefore);
 assert(fs.readFileSync(path.join(h,'stub-calls'),'utf8').includes('npx'),'the skills CLI step ran');
 // Moving the text outside the markers is the whole remedy.
 fs.writeFileSync(x,text.replace('OPERATOR RULE\n','')+'OPERATOR RULE\n');ok(up(['update','--no-claude']));assert(fs.readFileSync(x,'utf8').endsWith('OPERATOR RULE\n'));
});
test('the explicit rules command names the file and line of foreign text and writes nothing',(h,run)=>{
 const x=host(h,'.codex','AGENTS.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--agent','codex']));const {text,line}=intrude(x);
 const r=run(['rules','--apply','--agent','codex']);assert.equal(r.status,1,r.stdout+r.stderr);assert(r.stdout.includes(`${x}:${line}`),r.stdout);assert.equal(fs.readFileSync(x,'utf8'),text);
});
// B-208: an enabled rule never reached a host added later, and nothing said so.
test('update names a policy-on host without a receipt with the exact command and writes nothing there',(h,run,env)=>{
 const x=host(h,'.codex','AGENTS.md'),p=host(h,path.join('.pi','agent'),'AGENTS.md');ok(run(['config','set','rules.wait','on']));ok(run(['rules','--apply','--agent','codex']));
 const up=packaged(h,env);
 for(let i=0;i<3;i++){const r=up(['update','--no-claude']);ok(r);assert(r.stdout.includes(`rules.wait: pi not applied — ${p}`),r.stdout);assert(r.stdout.includes('npx sshlg-skills rules --apply --agent pi'),r.stdout);assert(!/cursor: not-applied|cursor not applied/.test(r.stdout),r.stdout);}
 assert.equal(fs.readFileSync(p,'utf8'),'USER TEXT\n');
 ok(run(['rules','--apply','--agent','pi']));const r=up(['update','--no-claude']);ok(r);assert(!r.stdout.includes('rules.wait: pi not applied'),r.stdout);assert(r.stdout.includes('rules.wait: pi unchanged'),r.stdout);
 // Off: a host never applied is not a gap.
 ok(run(['config','set','rules.wait','off']));host(h,'.gemini','GEMINI.md');const off=up(['update','--no-claude']);ok(off);assert(!off.stdout.includes('not applied —'),off.stdout);
});
console.log(failed ? `FAIL: wait_rules_cli — ${n} passed; ${failed} failed` : `PASS: wait_rules_cli — ${n} cases`);process.exitCode=failed?1:0;
