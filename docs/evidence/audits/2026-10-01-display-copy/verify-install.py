#!/usr/bin/env python3
"""Bounded receipt for the 2026-10-01 release; run from this source revision.

Checks installed files and executes the installed linter. Already-running agent
contexts are not introspected: restart remains explicit. No private host content
is written to the receipt. The private host baseline is optional and never shipped.
"""
from pathlib import Path
import hashlib,json,re,subprocess,tempfile,sys
import argparse
parser=argparse.ArgumentParser(description='Verify this release on an already-updated machine; does not install or reload agents.')
parser.add_argument('--host-baseline',type=Path,help='Private before.json from the pre-update host backup; omitted means preservation NOT_RUN')
parser.add_argument('--output',type=Path,required=True,help='New receipt path; existing files are refused')
args=parser.parse_args()
if args.output.exists():raise SystemExit('Refusing to replace an existing dated receipt')
root=Path(__file__).resolve().parents[4]
expected=[]
for member, subdir, target in [('super-ux','plugins/super-ux/skills/copywriting',Path.home()/'.agents/skills/copywriting'),('sheleg-design','plugins/sheleg-design/skills/sheleg-design',Path.home()/'.agents/skills/sheleg-design')]:
 for name in (['SKILL.md','references/ai-tells.md','references/brand-contract.md','references/marketing-copy.md'] if member=='super-ux' else ['SKILL.md','VISUAL_REVIEW.md','CREATIVE_DIRECTOR.md']):
  source=root/'skills'/member/subdir/name
  expected.append({'installed':str(target/name),'source':str(source.relative_to(root)),'expected_sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
runtime=json.loads((Path.home()/'.sshlg-skills/runtime/package.json').read_text()).get('version')
assert runtime=='1.52.6',('runtime version',runtime)

rows=[]
for item in expected:
 target=Path(item['installed']);actual=hashlib.sha256(target.read_bytes()).hexdigest() if target.is_file() else None
 rows.append({'source':item['source'],'installed':str(target).replace(str(Path.home()),'~'),'expected_sha256':item['expected_sha256'],'actual_sha256':actual,'matches':actual==item['expected_sha256']})
plugins=json.loads((Path.home()/'.claude/plugins/installed_plugins.json').read_text())['plugins']
for key, version, files in [('super-ux@super-ux','0.56.3',['scripts/brand_lint.py','skills/copywriting/SKILL.md']),('sheleg-design@sheleg-design-skill','1.61.2',['skills/sheleg-design/SKILL.md','skills/sheleg-design/VISUAL_REVIEW.md'])]:
 entries=plugins[key];entry=next(e for e in entries if e['scope']=='user'); assert entry['version']==version,(key,entry['version'])
 target_root=Path(entry['installPath']);member='super-ux' if key.startswith('super-ux') else 'sheleg-design'
 for f in files:
  source=root/'skills'/member/'plugins'/member/f;target=target_root/f
  rows.append({'source':str(source.relative_to(root)),'installed':str(target).replace(str(Path.home()),'~'),'matches':source.read_bytes()==target.read_bytes(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
 if member=='super-ux':script=target_root/'scripts/brand_lint.py'
native=Path.home()/'.codex/plugins/cache/sheleg-design-skill/sheleg-design/1.61.2/skills/sheleg-design/VISUAL_REVIEW.md'
source=root/'skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/VISUAL_REVIEW.md'
rows.append({'source':str(source.relative_to(root)),'installed':str(native).replace(str(Path.home()),'~'),'matches':native.is_file() and source.read_bytes()==native.read_bytes()})
assert all(row['matches'] for row in rows),rows
before=json.loads(args.host_baseline.read_text()) if args.host_baseline else [];preservation=[]
for item in before:
 if item['outside_router_sha256'] is None:continue
 text=(Path.home()/item['path']).read_text();outside=re.sub(r'<!-- SSHLG:ROUTERS:BEGIN[\s\S]*?<!-- SSHLG:ROUTERS:END -->','',text)
 preservation.append({'path':'~/'+item['path'],'outside_managed_router_unchanged':hashlib.sha256(outside.encode()).hexdigest()==item['outside_router_sha256']})
assert all(row['outside_managed_router_unchanged'] for row in preservation),preservation
sys.path.insert(0,str(root/'skills/super-ux/test'));from brand_lint_test import MINIMAL
smoke=[]
with tempfile.TemporaryDirectory() as directory:
 temp=Path(directory);brand=temp/'docs/brand';brand.mkdir(parents=True)
 for name,content in MINIMAL.items():(brand/name).write_text(content)
 (brand/'README.md').write_text('Contract: brand-contract v1\nSources:\n  marketing: page.html\n')
 for name,html,expected in [('nested title','<h1>Your <em>agents.</em></h1>',1),('meaningful punctuation','<h1>Ready?</h1><h2><code>git add .</code></h2>',0)]:
  (temp/'page.html').write_text(html);result=subprocess.run(['python3',str(script),str(brand),'--json','--fail-on','B063'],capture_output=True,text=True);findings=json.loads(result.stdout);assert result.returncode==expected,(name,result.returncode,result.stderr)
  smoke.append({'case':name,'exit':result.returncode,'expected':expected,'codes':sorted({r['code'] for r in findings})})
 (temp/'page.html').unlink();result=subprocess.run(['python3',str(script),str(brand),'--json'],capture_output=True,text=True);assert result.returncode==2
 smoke.append({'case':'missing source','exit':result.returncode,'expected':2,'codes':sorted({r['code'] for r in json.loads(result.stdout)})})
receipt={'umbrella_runtime':runtime,'host_preservation_status':'PASS' if args.host_baseline else 'NOT_RUN','members':{'super-ux':'0.56.3','sheleg-design':'1.61.2'},'file_checks':rows,'host_file_preservation':preservation,'installed_linter_smoke':smoke,'activation':'Installed bytes verified; already-running agent sessions require restart to load the new skill context.'}
args.output.write_text(json.dumps(receipt,indent=2)+'\n')
print('PASS:',len(rows),'installed byte comparisons;',len(preservation),'host files preserve text outside routers; 3 installed-linter probes')
