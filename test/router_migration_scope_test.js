'use strict';
// The filesystem emitter was scoped, but its earlier migration was not.
// Real CLI processes and synthetic host files expose that pre-emitter boundary.
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),BIN=path.join(ROOT,'bin/sshlg-skills.js');
const hosts={claude:['.claude','CLAUDE.md'],codex:['.codex','AGENTS.md'],gemini:['.gemini','GEMINI.md'],pi:['.pi/agent','AGENTS.md']};
let cases=0,failed=0;
function fixture(fn){const home=fs.mkdtempSync(path.join(os.tmpdir(),'owned-router-migration-'));try{
 const files={},before={};for(const [host,[dir,name]] of Object.entries(hosts)){const file=path.join(home,dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});files[host]=file;before[host]=`<!-- FOREIGN:${host}:BEGIN -->\n## UX scenarios\n${host} AUTHORED WORDING\n\n## Other\n${host} KEEP\n<!-- FOREIGN:${host}:END -->\n`;fs.writeFileSync(file,before[host]);}
 fs.mkdirSync(path.join(home,'.sshlg-skills'));fs.writeFileSync(path.join(home,'.sshlg-skills/state.json'),'{"routers":"yes"}');
 const env={...process.env,HOME:home};for(const key of ['CLAUDE_CONFIG_DIR','CODEX_HOME','GEMINI_CONFIG_DIR','PI_CODING_AGENT_DIR','NODE_OPTIONS'])delete env[key];
 function run(args,extra={}){return spawnSync(process.execPath,[BIN,'routers','--update',...args],{cwd:ROOT,env:{...env,...extra},encoding:'utf8',timeout:30000});}
 fn({home,files,before,run});
 }finally{fs.rmSync(home,{recursive:true,force:true});}}
function test(name,fn){try{fixture(fn);cases++;console.log('ok '+name);}catch(e){failed++;console.log('FAIL '+name+': '+e.message.split('\n')[0]);}}
function ok(r){assert.equal(r.status,0,r.stdout+r.stderr);}
function untouched(f,names){for(const host of names)assert.equal(fs.readFileSync(f.files[host],'utf8'),f.before[host],host+' unselected bytes changed');}
for(const [args,selected] of [[['--agent','codex'],['codex']],[['--no-claude'],['codex','gemini','pi']],[['--claude-only'],['claude']]])test(args.join(' ')+' leaves unselected legacy headings and foreign markers exact',f=>{
 ok(f.run(args));untouched(f,Object.keys(hosts).filter(h=>!selected.includes(h)));
 for(const host of selected){const body=fs.readFileSync(f.files[host],'utf8');assert(body.includes('SSHLG:ROUTERS:BEGIN'));assert(body.includes(host+' KEEP'));}
});
function refuseReads(f){const shim=path.join(f.home,'refuse-unselected.cjs');fs.writeFileSync(shim,`const fs=require('fs'),read=fs.readFileSync;const forbidden=${JSON.stringify([f.files.claude,f.files.gemini,f.files.pi])};fs.readFileSync=function(file,...args){if(forbidden.includes(String(file)))throw Error('read unselected host');return read.call(this,file,...args);};`);return '--require='+shim;}
test('unselected instruction files are never read before scoped emission',f=>{ok(f.run(['--agent','codex'],{NODE_OPTIONS:refuseReads(f)}));untouched(f,['claude','gemini','pi']);});
test('dry-run reads only selected instructions and preserves all host bytes',f=>{ok(f.run(['--agent','codex','--dry-run'],{NODE_OPTIONS:refuseReads(f)}));untouched(f,Object.keys(hosts));});
test('selected relocated profile migrates while default and foreign profiles stay exact',f=>{
 const root=path.join(f.home,'custom codex');fs.mkdirSync(root);const file=path.join(root,'AGENTS.md');fs.writeFileSync(file,'## UX scenarios\nCUSTOM CODEX WORDING\n');
 ok(f.run(['--agent','codex'],{CODEX_HOME:root}));untouched(f,Object.keys(hosts));const body=fs.readFileSync(file,'utf8');assert(body.includes('CUSTOM CODEX WORDING'));assert(body.includes('SSHLG:ROUTERS:BEGIN'));
});
test('selected recognized heading still migrates into the owned block',f=>{fs.rmSync(path.join(f.home,'.claude'),{recursive:true});fs.rmSync(path.join(f.home,'.gemini'),{recursive:true});fs.rmSync(path.join(f.home,'.pi'),{recursive:true});ok(f.run(['--agent','codex']));const body=fs.readFileSync(f.files.codex,'utf8');assert(body.includes('codex AUTHORED WORDING'));assert(!body.includes('## UX scenarios'));assert(body.includes('SSHLG:ROUTER:super-ux:BEGIN'));});
if(failed){console.log(`FAIL: ${failed} of ${failed+cases} router migration scope cases`);process.exitCode=1;}else console.log(`PASS: router migration scope — ${cases} cases`);
