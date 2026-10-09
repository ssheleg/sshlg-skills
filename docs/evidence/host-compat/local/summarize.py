#!/usr/bin/env python3
"""Summarize private read-only CLI receipts without exporting configs or skill bodies."""
import argparse,json,re,hashlib,tomllib,os
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--private',required=True,type=Path);p.add_argument('--phase',choices=['before','after'],required=True);p.add_argument('--output',required=True,type=Path);a=p.parse_args()
root=Path(__file__).resolve().parents[4]
manifest=json.loads((root/'skills.json').read_text());family={n for m in manifest['skills'] for n in m.get('skillNames',[m['name']])};members={m['name'] for m in manifest['skills']}
read=lambda n:json.loads((a.private/n).read_text())
versions=[{k:x[k] for k in ['client','installed','exit','version','status'] if k in x} for x in read('client-versions.json')]
codex_home=Path(os.environ.get('CODEX_HOME',str(Path.home()/'.codex')))
# Hermes --version includes installation details after the first line: omit them.
for row in versions:
 if 'version' in row:row['version']=row['version'].splitlines()[0]
claude=read('claude-plugins-'+a.phase+'.json');codex=read('codex-plugins-'+a.phase+'.json')['installed']
plugins={host:[{k:x[k] for k in ['name','version','enabled'] if k in x} for x in rows if x.get('name',x.get('id','').split('@')[0]) in members] for host,rows in [('codex',codex)]}
plugins['claude']=[{'name':x['id'].split('@')[0],'version':x['version'],'enabled':x['enabled']} for x in claude if x['id'].split('@')[0] in members]
r=read('codex-'+a.phase+'/skills-roster.json')['result']['data'][0];plain=[x for x in r['skills'] if x['name'] in family];plain_names={x['name'] for x in plain};plain_enabled={x['name'] for x in plain if x['enabled']}
g=(a.private/('gemini-skills-'+a.phase+'-complete.txt')).read_text();gn=set(re.findall(r'^([^\n]+) \[Enabled\]$',g,re.M))
o=read('opencode-skills-'+a.phase+'-complete.json');on={x['name'] for x in o}
raw_h=read('hermes-'+a.phase+'.json');hn=set(raw_h['family_found'])&family;h={'version':raw_h['version'],'scope':'native filtered loader; no model call','total':raw_h['total'],'family_found':len(hn),'family_missing':sorted(family-hn),'model_executed':False}
receipt={'as_of':'2026-10-10','phase':a.phase,'model_executed':False,'versions':versions,'plugins_registered':plugins,'discovery':{
 'codex_plain_roster':{'total':len(r['skills']),'enabled':sum(x['enabled'] for x in r['skills']),'errors':len(r['errors']),'family_found':len(plain_names),'family_missing':sorted(family-plain_names),'duplicate_family_rows':len(plain)-len(plain_names),'family_enabled':len(plain_enabled),'note':'Native plugin registration is a separate row; preserved explicit path exclusions explain disabled shared copies.'},
 'gemini':{'family_found':len(gn&family),'family_missing':sorted(family-gn),'scope':'native skills list --all; file stdout capture'},
 'opencode':{'total':len(o),'family_found':len(on&family),'family_missing':sorted(family-on),'scope':'native --pure debug skill; external plugins not loaded; file stdout capture'},
 'hermes':h,
 'kimi':{'scope':'documented native shared root and filesystem presence; no native loader probe exposed by CLI','shared_family_found':sum((Path.home()/'.agents/skills'/n/'SKILL.md').is_file() for n in family),'native_runtime':'NOT_RUN'}},
 'limits':['No model/provider turn, hook-effect test or delegation behavior executed.','First piped Gemini/OpenCode outputs were truncated despite exit 0; only complete file-captured outputs count.','Hermes emitted pre-existing Teams/Google Chat toolset warnings; those channels were not changed.']}
if a.phase=='after':
 before=(a.private/'config-before.sha256').read_text().strip();after=hashlib.sha256((codex_home/'config.toml').read_bytes()).hexdigest();receipt['codex_config_bytes_unchanged']=before==after
 original=read('config-before-top-key-hashes.json');current=tomllib.loads((codex_home/'config.toml').read_text());hashed={k:hashlib.sha256(json.dumps(v,sort_keys=True,default=str).encode()).hexdigest() for k,v in current.items()};changed=sorted(k for k in set(original)|set(hashed) if original.get(k)!=hashed.get(k));receipt['codex_config_changed_sections']=changed;receipt['codex_model_permissions_and_other_sections_preserved']=set(changed)<={'marketplaces'}
 # Compare exact disabled skill path identities privately; publish only count/equality.
 br=read('codex-before/skills-roster.json')['result']['data'][0]['skills'];bs=sorted(x['path'] for x in br if not x['enabled']);ns=sorted(x['path'] for x in r['skills'] if not x['enabled']);receipt['disabled_roster']={'before':len(bs),'after':len(ns),'same_paths':bs==ns}
checks={'codex_discovery_complete':plain_names==family and not r['errors'],'gemini_discovery_complete':family<=gn,'opencode_discovery_complete':family<=on,'hermes_discovery_complete':family<=hn,'claude_family_registered':{x['name'] for x in plugins['claude'] if x['enabled']}==members}
if a.phase=='after':
 checks['codex_exclusions_preserved']=receipt['disabled_roster']['same_paths'];checks['codex_configuration_preserved_except_marketplace_pins']=receipt['codex_model_permissions_and_other_sections_preserved']
receipt['checks']=checks;receipt['acceptance']='PASS' if all(checks.values()) else 'FAIL'
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'phase':a.phase,'family':len(family),'discovery':{k:v.get('family_found',v.get('shared_family_found')) for k,v in receipt['discovery'].items()}}))

raise SystemExit(0 if receipt['acceptance']=='PASS' else 1)
