"""Opt-in actual native CLI transaction probe; entirely synthetic HOME + local Git."""
import json, os, pathlib, shutil, subprocess, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
box = pathlib.Path(tempfile.mkdtemp(prefix='owned-claude-transaction-'))
try:
    repo = box/'source'; repo.mkdir()
    home = box/'home'; home.mkdir()
    profile = home/'.claude'
    env = {k:v for k,v in os.environ.items() if not any(x in k.upper() for x in ('TOKEN','SECRET','API_KEY','AUTH'))}
    env.update(HOME=str(home), CLAUDE_CONFIG_DIR=str(profile), XDG_CONFIG_HOME=str(home/'.config'), GIT_CONFIG_GLOBAL=str(home/'.gitconfig'), GIT_CONFIG_NOSYSTEM='1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC='1', DISABLE_AUTOUPDATER='1')
    def run(args, cwd=repo):
        r = subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True, timeout=180)
        assert r.returncode == 0, (args, r.returncode, r.stdout, r.stderr)
        return r.stdout.strip()
    def git(*args): return run(['git',*args])
    git('init','-q'); git('config','user.name','Synthetic'); git('config','user.email','synthetic@example.invalid')
    (repo/'.claude-plugin').mkdir(); (repo/'plugins/probe/.claude-plugin').mkdir(parents=True)
    (repo/'.claude-plugin/marketplace.json').write_text(json.dumps({'name':'owned-pin-probe','owner':{'name':'Synthetic'},'plugins':[{'name':'probe','source':'./plugins/probe'}]}))
    (repo/'plugins/probe/.claude-plugin/plugin.json').write_text(json.dumps({'name':'probe','version':'1.0.0'}))
    payload = repo/'plugins/probe/value.txt'; payload.write_text('first')
    git('add','.'); git('commit','-qm','first'); a=git('rev-parse','HEAD'); git('tag','first')
    payload.write_text('second'); git('add','.'); git('commit','-qm','second'); b=git('rev-parse','HEAD')
    (repo/'plugins/probe/.claude-plugin/plugin.json').write_text(json.dumps({'name':'probe','version':'2.0.0'}))
    payload.write_text('third');git('add','.');git('commit','-qm','third');c=git('rev-parse','HEAD')
    run(['git','config','--global',f'url.file://{repo}.insteadOf','https://github.com/fixture-owner/probe.git'])
    run(['claude','plugin','marketplace','add','https://github.com/fixture-owner/probe.git#first'],box)
    run(['claude','plugin','install','probe@owned-pin-probe','--scope','user'],box)
    settings=profile/'settings.json'; obj=json.loads(settings.read_text()); obj['enabledPlugins']['probe@owned-pin-probe']=False; obj['enabledPlugins']['foreign@foreign']=False; obj['env']={'SYNTHETIC':'preserved'}
    settings.write_text(json.dumps(obj,indent=3)+'\n')
    data=profile/'plugins/data/probe-owned-pin-probe';data.mkdir(parents=True);(data/'owned.txt').write_text('preserve')
    script=box/'exercise.js'
    script.write_text(r'''
const assert=require('assert'),fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=process.argv[2],box=process.argv[3],a=process.argv[4],b=process.argv[5],c=process.argv[6];
const S=require(root+'/lib/claude-plugin-source'),P=require(root+'/lib/claude-pinned'),T=require(root+'/lib/claude-pin-transaction');
const home=box+'/home',profile=home+'/.claude',id='probe@owned-pin-probe';
const m={name:'fixture',repo:'fixture-owner/probe',commit:b,version:'1.0.0',pluginInstall:id,dir:'source'};
const inventory=S.generate([m],box),opts={home,profileRoot:profile};
let fault=true;
const runner=(cmd,args,o)=>{if(fault && args[0]==='plugin' && args[1]==='install'){fault=false;return {status:1,stdout:'',stderr:'injected fixture failure'};}return spawnSync(cmd,args,o);};
const failed=T.execute(P.prepare([m],inventory,opts),[m],inventory,{runner});
assert.equal(failed.ok,false,JSON.stringify(failed));assert.equal(failed.results[0].rollback,'verified-prior-payload',JSON.stringify(failed));
let rec=JSON.parse(fs.readFileSync(profile+'/plugins/installed_plugins.json')).plugins[id][0];
assert.equal(rec.gitCommitSha,a);assert.equal(fs.readFileSync(rec.installPath+'/value.txt','utf8'),'first');
const repaired=T.execute(P.prepare([m],inventory,opts),[m],inventory);
assert.equal(repaired.ok,true,JSON.stringify(repaired));
rec=JSON.parse(fs.readFileSync(profile+'/plugins/installed_plugins.json')).plugins[id][0];assert.equal(rec.gitCommitSha,b);assert.equal(fs.readFileSync(rec.installPath+'/value.txt','utf8'),'second');
let settings=JSON.parse(fs.readFileSync(profile+'/settings.json'));assert.equal(settings.enabledPlugins[id],false);assert.equal(settings.enabledPlugins['foreign@foreign'],false);assert.equal(settings.env.SYNTHETIC,'preserved');assert.equal(fs.readFileSync(profile+'/plugins/data/probe-owned-pin-probe/owned.txt','utf8'),'preserve');
assert.equal(P.prepare([m],inventory,opts).jobs[0].action,'verify');
const verified=T.execute(P.prepare([m],inventory,opts),[m],inventory);assert.equal(verified.ok,true,JSON.stringify(verified));

// Exercise the packaged entry point too; preview must not call any child.
const pkg=box+'/package';fs.mkdirSync(pkg);
for(const d of ['bin','lib'])fs.cpSync(root+'/'+d,pkg+'/'+d,{recursive:true});
fs.copyFileSync(root+'/package.json',pkg+'/package.json');
const full=JSON.parse(fs.readFileSync(root+'/skills.json'));full.skills=[{...m,marketplace:'owned-pin-probe',pluginMarketplace:'fixture-owner/probe',skillNames:['probe']}];
fs.writeFileSync(pkg+'/skills.json',JSON.stringify(full));fs.writeFileSync(pkg+'/claude-plugin-pins.json',JSON.stringify(inventory));
const shim=box+'/no-child.cjs';fs.writeFileSync(shim,"require('child_process').spawnSync=()=>{throw Error('preview spawned a child')};");
const argv=[pkg+'/bin/sshlg-skills.js','install','--claude-only','--member','fixture'];
const preview=spawnSync(process.execPath,[...argv,'--dry-run'],{cwd:box,env:{...process.env,NODE_OPTIONS:'--require='+shim},encoding:'utf8'});assert.equal(preview.status,0,preview.stdout+preview.stderr);assert(preview.stdout.includes('verify @ '+b));assert(!preview.stdout.includes('SYNTHETIC'));
const launched=spawnSync(process.execPath,argv,{cwd:box,env:process.env,encoding:'utf8',timeout:180000});assert.equal(launched.status,0,launched.stdout+launched.stderr);assert(launched.stdout.includes('verified immutable payloads'));

const home2=box+'/fresh-home',profile2=home2+'/.claude';fs.mkdirSync(home2);const opts2={home:home2,profileRoot:profile2};
const fresh=T.execute(P.prepare([m],inventory,opts2),[m],inventory);assert(fresh.ok,JSON.stringify(fresh));assert.equal(fresh.results[0].action,'install');
const newer={...m,version:'2.0.0',commit:c},newInventory=S.generate([newer],box);
let settings2=JSON.parse(fs.readFileSync(profile2+'/settings.json'));settings2.enabledPlugins[id]=false;fs.writeFileSync(profile2+'/settings.json',JSON.stringify(settings2));
const upgrade=T.execute(P.prepare([newer],newInventory,opts2),[newer],newInventory);assert(upgrade.ok,JSON.stringify(upgrade));assert.equal(upgrade.results[0].action,'update');
const downgrade=T.execute(P.prepare([m],inventory,opts2),[m],inventory);assert(downgrade.ok,JSON.stringify(downgrade));assert.equal(downgrade.results[0].action,'update');assert.equal(JSON.parse(fs.readFileSync(profile2+'/settings.json')).enabledPlugins[id],false);
console.log(JSON.stringify({native:spawnSync('claude',['--version'],{encoding:'utf8'}).stdout.trim(),fresh:fresh.ok,upgrade:upgrade.ok,downgrade:downgrade.ok,rollback:failed.results[0].rollback,repaired:repaired.ok,verified:verified.ok,enabled:false,dataPreserved:true,files:repaired.results[0].files}));
''')
    print(run(['node',str(script),str(ROOT),str(box),a,b,c],box),flush=True)
finally:
    shutil.rmtree(box)
    print('Owned synthetic transaction tree removed.',flush=True)
