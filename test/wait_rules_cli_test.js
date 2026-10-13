'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const BIN=path.resolve(__dirname,'../bin/sshlg-skills.js');
let n=0,failed=0;
function test(name,fn){const home=fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-wait-cli-'));try{
 const env={...process.env,HOME:home};for(const k of ['CLAUDE_CONFIG_DIR','CODEX_HOME','GEMINI_CONFIG_DIR','PI_CODING_AGENT_DIR','NODE_OPTIONS'])delete env[k];
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
console.log(`${failed?'FAIL':'OK'} (${n} checks; ${failed} failed)`);process.exitCode=failed?1:0;
