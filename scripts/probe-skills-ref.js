#!/usr/bin/env node
'use strict';
// Optional upstream contract probe: no install/download of the CLI. Supply an
// already installed skills@1.7.2 bundle. All installs and Git clones are local
// synthetic payloads in an owned temporary HOME, with fetch disabled.
const fs=require('fs'), os=require('os'), path=require('path'), vm=require('vm');
const assert=require('assert'), {spawnSync}=require('child_process');
const {createHash}=require('crypto');
if(process.argv.length!==4 || process.argv[2]!=='--cli') {
  console.error('usage: node scripts/probe-skills-ref.js --cli <skills/dist/cli.mjs>');process.exit(2);
}
const cli=path.resolve(process.argv[3]);
const pkg=JSON.parse(fs.readFileSync(path.join(path.dirname(cli),'..','package.json'),'utf8'));
assert.equal(pkg.version,'1.7.2','unreviewed upstream CLI version');
const source=fs.readFileSync(cli,'utf8');
const begin=source.indexOf('const DEFAULT_GITHUB_HOST ='),end=source.indexOf('const CSI_RE =');
assert(begin>=0 && end>begin,'upstream parser boundary changed; review the probe');
const parse=vm.runInNewContext(source.slice(begin,end)+';parseSource',{
  process:{env:{}},URL,isAbsolute:path.isAbsolute,resolve:path.resolve,
  fetch:()=>{throw Error('network disabled');}
});
const sample='a'.repeat(40), at=parse('example/probe@'+sample), hash=parse('example/probe#'+sample);
assert.equal(at.ref,undefined);assert.equal(at.skillFilter,sample);
assert.equal(hash.ref,sample);assert.equal(hash.skillFilter,undefined);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sshlg-skills-ref-'));
try {
  const repo=path.join(tmp,'repo'),home=path.join(tmp,'home'),scratch=path.join(tmp,'tmp');
  for(const dir of [repo,home,scratch])fs.mkdirSync(dir);
  const config=path.join(tmp,'gitconfig'),preload=path.join(tmp,'no-fetch.cjs');
  fs.writeFileSync(config,`[url "file://${repo}"]\n insteadOf = https://pin.invalid/source.git\n[protocol "file"]\n allow = always\n`);
  fs.writeFileSync(preload,'globalThis.fetch=async()=>{throw new Error("NETWORK_DISABLED_PROBE")};');
  const env={...process.env,HOME:home,USERPROFILE:home,XDG_CONFIG_HOME:path.join(home,'.config'),
    GIT_CONFIG_GLOBAL:config,GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0',
    DISABLE_TELEMETRY:'1',DO_NOT_TRACK:'1',TMPDIR:scratch,NODE_OPTIONS:'--require='+preload};
  for(const k of ['GIT_CONFIG_COUNT','GIT_CONFIG_PARAMETERS','GIT_DIR','GIT_WORK_TREE'])delete env[k];
  const run=(cmd,args)=>{
    const r=spawnSync(cmd,args,{cwd:repo,env,encoding:'utf8',timeout:30000});
    assert.equal(r.status,0,(r.stdout+r.stderr).slice(-1800));return r.stdout.trim();
  };
  const git=(...a)=>run('git',a);
  git('init','-q');git('config','user.name','Synthetic probe');git('config','user.email','probe@example.invalid');
  const dir=path.join(repo,'skills','pin-probe');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,'SKILL.md');
  const text='---\nname: pin-probe\ndescription: Synthetic immutable-source contract fixture.\n---\n\n';
  fs.writeFileSync(file,text+'PINNED_A\n');git('add','.');git('commit','-qm','A');const sha=git('rev-parse','HEAD');
  fs.writeFileSync(file,text+'FLOATING_B\n');git('add','.');git('commit','-qm','B');
  const sequence=[[sha,'PINNED_A'],['','FLOATING_B'],[sha,'PINNED_A'],[sha,'PINNED_A'],[sha,'PINNED_A']];
  for(const [ref,marker] of sequence) {
    run(process.execPath,[cli,'add','https://pin.invalid/source.git'+(ref?'#'+ref:''),
      '--agent','continue','--global','--yes','--copy']);
    const installed=path.join(home,'.continue','skills','pin-probe');
    assert(fs.lstatSync(installed).isDirectory() && !fs.lstatSync(installed).isSymbolicLink());
    assert.equal(fs.readFileSync(path.join(installed,'SKILL.md'),'utf8'),text+marker+'\n');
  }
  console.log(JSON.stringify({cli:'skills@'+pkg.version,bundle_sha256:createHash('sha256').update(source).digest('hex'),
    parser_at:'skillFilter',parser_hash:'ref',local_install_sequence:sequence.map(row=>row[1]),
    continue_directory:true,external_provider_calls:0},null,2));
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
