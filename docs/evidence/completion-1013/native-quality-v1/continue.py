#!/usr/bin/env python3
"""Reviewed three-cell continuation; never retry the stopped C cell or readiness."""
import argparse
import hashlib
import json
from pathlib import Path
import run as runner

ROOT=Path(__file__).resolve().parent
C_NAME='observed-c-20261013.json'
C_HASH='3be4c1c0ff3180e838585195c574cacd32b78a119e433b94eafa78ef67a156aa'
SEED=10132027
SETTINGS={'disableBundledSkills':True,'skillOverrides':{'doctor':'off','design':'off','plugin-authoring':'off'},'disableAllHooks':True,'autoMemoryEnabled':False,'claudeMdExcludes':['**'],'disableClaudeAiConnectors':True}
ORIGINAL_PLAN=runner.plan(SEED)

def configure(seed):
    if seed!=SEED:raise ValueError('continuation_seed_changed')
    data=(ROOT/C_NAME).read_bytes()
    if hashlib.sha256(data).hexdigest()!=C_HASH:raise ValueError('prior_C_changed')
    prior=json.loads(data)
    assert prior['status']=='STOPPED_TEST_ERROR' and prior['cost_incomplete'] is False
    assert prior['source_sha']=='8862fae9a826263f8109626ca257f81c7c43ac86'
    assert prior['prior_cli_invocations']==2 and len(prior['calls'])==3
    assert prior['reported_list_usd']==0.134326 and prior['combined_known_list_usd']==0.1834924
    expected=ORIGINAL_PLAN
    for index,arm in enumerate(('concise','full')):
        call=prior['calls'][index]
        assert call['phase']=='readiness' and call['arm']==arm
        assert call['evaluation_status']=='EXECUTED' and call['error_class'] is None
        assert call['native']['visible']==sorted(runner.SKILLS)
        assert call['native']['skill_loads']==[] and call['native']['read_files']==[]
        assert call['prompt_sha256']==runner.base.digest(expected[index]['prompt'])
    stopped=prior['calls'][2]
    assert stopped['phase']=='task' and stopped['arm']=='full' and stopped['case_id']=='a1'
    assert stopped['error_class']=='aggregate_input_bound' and stopped['evaluation_status']=='TEST_ERROR'
    assert stopped['prompt_sha256']==runner.base.digest(expected[2]['prompt'])
    for name,key in [('source.json','source_manifest_sha256'),('materialize.py','materializer_sha256'),('tasks.json','tasks_sha256'),('rubric.json','rubric_sha256')]:
        assert runner.base.digest((ROOT/name).read_bytes())==prior[key],key
    assert runner.base.digest((ROOT.parent/'description-screening-fixture-v2.json').read_bytes())==prior['arms_fixture_sha256']
    assert runner.SETTINGS==SETTINGS and runner.MAX_CUMULATIVE_CALLS==8 and runner.BUDGET==4.0
    assert runner.base.digest(runner.base.encode(runner.command(Path('/NATIVE_WORKSPACE'),'task')))=='9bcfcae144034ccdf2710548eabc29aa7dffa67cfca4b65b8c4d85278792ec5b'
    assert (runner.READY_INPUT,runner.TASK_INPUT,runner.MAX_TURNS,runner.RESERVE)==(24000,32000,6,0.50)
    assert [(x['arm'],x['case_id']) for x in expected[3:]]==[('concise','a1'),('concise','a2'),('full','a2')]
    def continuation_plan(value):
        if value!=SEED:raise ValueError('continuation_seed_changed')
        return expected[3:]
    runner.plan=continuation_plan
    runner.PRIOR_RECORDS=(('observed-20261013.json',0.0373944,1),('observed-b-20261013.json',0.011772000000000001,1),(C_NAME,0.134326,3))
    runner.PRIOR_COST=sum(cost for _,cost,_ in runner.PRIOR_RECORDS)
    runner.PRIOR_CALLS=5
    runner.MAX_CALLS=3
    return prior

def execute(args):
    configure(args.seed)
    # runner.execute performs fresh OAuth/version preflight and every task init,
    # source/body parity, tool confinement, usage, reserve and stop check again.
    return runner.execute(args,metadata={
        'protocol':'native-quality-explicit-three-cell-continuation/1',
        'continuation_of_sha256':C_HASH,
        'continuation_runner_sha256':runner.base.digest(Path(__file__).read_bytes()),
        'prior_readiness':'Both immutable C readiness calls EXECUTED; original C task remains TEST_ERROR; no call repeated.'})

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--execute',action='store_true');p.add_argument('--source-repo',type=Path);p.add_argument('--private-dir',type=Path);p.add_argument('--output',type=Path)
    args=p.parse_args();args.seed=SEED
    if not args.execute:
        configure(args.seed)
        print(json.dumps({'provider_calls':0,'plan':[{k:v for k,v in x.items() if k!='prompt'} for x in runner.plan(SEED)],'prior_cli_invocations':5,'max_new_cli_invocations':3,'max_cumulative_cli_invocations':8,'prior_reported_list_usd':runner.PRIOR_COST,'overall_reported_list_ceiling':4.0},indent=2));return 0
    if any(x is None for x in (args.source_repo,args.private_dir,args.output)):p.error('execution requires source-repo, private-dir and output')
    return execute(args)

if __name__=='__main__':raise SystemExit(main())
