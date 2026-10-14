"""Actual native local-enable probe; synthetic HOME, plugins and Git projects only."""
import argparse, hashlib, json, os, pathlib, shutil, subprocess, tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit('refusing to overwrite prior probe')
    box = pathlib.Path(tempfile.mkdtemp(prefix='owned-claude-local-enable-')).resolve()
    report = {'schema': 'claude-local-enable-probe/1', 'provider_calls': 0, 'operator_profile_mutations': 0, 'cases': []}
    try:
        source = box/'source'
        (source/'.claude-plugin').mkdir(parents=True)
        (source/'plugins/probe/.claude-plugin').mkdir(parents=True)
        (source/'.claude-plugin/marketplace.json').write_text(json.dumps({'name': 'owned-local-probe', 'owner': {'name': 'Synthetic'}, 'plugins': [{'name': 'probe', 'source': './plugins/probe'}]}))
        (source/'plugins/probe/.claude-plugin/plugin.json').write_text('{"name":"probe","version":"1.0.0"}')
        plugin = 'probe@owned-local-probe'
        cases = [(True, 'absent'), (False, 'absent'), (True, 'foreign-only'), (False, 'foreign-only'), (True, 'explicit-false')]
        for index, (global_enabled, local_shape) in enumerate(cases):
            case = box/str(index); home = case/'home'; cwd = case/'project'
            home.mkdir(parents=True); cwd.mkdir()
            profile = home/'.claude'
            env = {k: v for k, v in os.environ.items() if not any(w in k.upper() for w in ('TOKEN', 'SECRET', 'API_KEY', 'AUTH', 'CLAUDE'))}
            env.update(HOME=str(home), CLAUDE_CONFIG_DIR=str(profile), XDG_CONFIG_HOME=str(home/'.config'), GIT_CONFIG_GLOBAL=str(home/'.gitconfig'), GIT_CONFIG_NOSYSTEM='1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC='1', DISABLE_AUTOUPDATER='1')
            def run(argv):
                return subprocess.run(argv, cwd=cwd, env=env, capture_output=True, text=True, timeout=30)
            def require(argv):
                result = run(argv)
                assert result.returncode == 0, (argv, result.returncode, result.stdout, result.stderr)
                return result.stdout.strip()
            require(['git', 'init', '-q'])
            report['native'] = require(['claude', '--version'])
            require(['claude', 'plugin', 'marketplace', 'add', str(source)])
            require(['claude', 'plugin', 'install', plugin, '--scope', 'user'])
            settings = profile/'settings.json'
            data = json.loads(settings.read_text()); data['enabledPlugins'][plugin] = global_enabled
            settings.write_text(json.dumps(data, indent=2)+'\n')
            local = cwd/'.claude/settings.local.json'
            if local_shape != 'absent':
                local.parent.mkdir(parents=True, exist_ok=True)
                data = {'env': {'SYNTHETIC_FOREIGN': 'preserve'}}
                if local_shape == 'explicit-false':
                    data['enabledPlugins'] = {plugin: False}
                local.write_text(json.dumps(data, indent=3)+'\n')
            before = local.read_text() if local.exists() else None
            global_before = settings.read_bytes()
            result = run(['claude', 'plugin', 'enable', plugin, '--scope', 'local'])
            after = local.read_text() if local.exists() else None
            output = result.stdout+'\n'+result.stderr
            message_class = 'already-enabled' if 'already enabled' in output.lower() else 'enabled' if 'enabled' in output.lower() else 'other'
            row = {'global_enabled': global_enabled, 'local_shape': local_shape, 'local_before': before, 'local_after': after, 'exit': result.returncode, 'message_class': message_class, 'stdout': result.stdout, 'stderr': result.stderr, 'global_bytes_unchanged': settings.read_bytes() == global_before, 'local_enabled_after': json.loads(after).get('enabledPlugins', {}).get(plugin) if after is not None else None}
            report['cases'].append(row)
            print(json.dumps({k: row[k] for k in ('global_enabled','local_shape','exit','message_class','local_enabled_after','global_bytes_unchanged')}), flush=True)
    finally:
        shutil.rmtree(box)
        report['owned_fixture_removed'] = not box.exists()
    report['probe_sha256'] = hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2).replace(str(box), '<sandbox>')+'\n')


if __name__ == '__main__':
    main()
