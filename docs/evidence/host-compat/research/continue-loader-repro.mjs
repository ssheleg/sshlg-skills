import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const sourceURL='https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/util/loadMarkdownSkills.ts';
const response=await fetch(sourceURL);
if(!response.ok)throw Error('source fetch failed '+response.status);
const source=await response.text();
if(createHash('sha256').update(source).digest('hex')!=='7c8ac3242ca5aeb9b119f62186fc1d70f24bbe810ac6cd1f0ee7bdc293ee840c')throw Error('Continue source digest changed');
const helper=source.slice(source.indexOf('async function getSkillFilesFromDir('),source.indexOf('export async function loadMarkdownSkills('));
if(!helper.includes('.filter((dir) => dir.isDirectory())')) throw Error('source boundary changed');
const discover=vm.runInNewContext('('+stripTypeScriptTypes(helper)+')',{fsPromises,path});
const cli=process.argv[2];
const expected='8409e4055ea6753255f1439eddf3fbc2f9989bc54e08708bc00ad0a00bfbed0d';
if(createHash('sha256').update(fs.readFileSync(cli)).digest('hex')!==expected)throw Error('wrong skills CLI bytes');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'continue-hc-'));
try {
 const home=path.join(tmp,'home'), fixture=path.join(tmp,'fixture');fs.mkdirSync(home);fs.mkdirSync(fixture);
 fs.writeFileSync(path.join(fixture,'SKILL.md'),'---\nname: hc-probe\ndescription: Disposable discovery probe.\n---\nRead this fixture.\n');
 const env={PATH:process.env.PATH,HOME:home,USERPROFILE:home,XDG_CONFIG_HOME:path.join(home,'.config'),CONTINUE_GLOBAL_DIR:path.join(home,'.continue'),DISABLE_TELEMETRY:'1',DO_NOT_TRACK:'1',CI:'1'};
 const results=[];
 for(const mode of ['single-default','mixed-default','mixed-copy']){
  const args=[cli,'add',fixture,'--agent','continue','--global','--yes',...(mode.startsWith('mixed')?['--agent','codex']:[]),...(mode==='mixed-copy'?['--copy']:[])];
  const r=spawnSync(process.execPath,args,{cwd:tmp,env,encoding:'utf8',timeout:30000});
  if(r.status!==0)throw Error('fixture install failed '+r.status+' '+r.stdout+' '+r.stderr);
  const target=path.join(home,'.continue/skills/hc-probe');
  const paths=await discover(path.dirname(target));
  results.push({mode,installer_exit:r.status,target_is_symlink:fs.lstatSync(target).isSymbolicLink(),discovered_count:paths.length,canonical_present:fs.existsSync(path.join(home,'.agents/skills/hc-probe/SKILL.md'))});
 }
 if(results[0].discovered_count!==1||results[1].discovered_count!==0||results[2].discovered_count!==1)throw Error('unexpected probe outcome '+JSON.stringify(results));
 console.log(JSON.stringify({as_of:new Date().toISOString(),sourceURL,source_sha256:createHash('sha256').update(source).digest('hex'),helper_sha256:createHash('sha256').update(helper).digest('hex'),skillsCli:'skills@1.5.25',skills_cli_sha256:expected,node:process.version,platform:process.platform,scope:'Exact Continue discovery helper (types stripped only), not full native/model run; actual pinned skills installer against a temporary HOME',results,temporary_home_removed:true},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
