#!/usr/bin/env python3
"""Reproduce only in an owned namespace; never acquire the public scratch lock.
Usage: python3 shared-lock-lifetime-probe.py OWNER_REPO IMMUTABLE_COMMIT
Synthetic child uses the actual runner's default subprocess descriptor policy.
"""
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time

repo, source = sys.argv[1:]
helper = subprocess.check_output(['git', 'show', source + ':test/negative_lock.py'], cwd=repo)
with tempfile.TemporaryDirectory(prefix='observer-lock-lifetime-') as folder:
    root = Path(folder)
    (root / 'negative_lock.py').write_bytes(helper)
    (root / 'plant.py').write_text('''import pathlib,sys,time
r=pathlib.Path(sys.argv[1]);(r/'ready').write_text('ready');end=time.monotonic()+8
while not (r/'go').exists():
 if time.monotonic()>end:sys.exit(2)
 time.sleep(.01)
(r/'late-write').write_text('original plant wrote after next runner admission')
''')
    (root / 'holder.py').write_text('''import sys,pathlib,subprocess,os
import negative_lock as m
r=pathlib.Path(sys.argv[1]);m.scratch_lock_path=lambda:str(r/'owned.lock')
held=m.acquire_scratch_lock()
p=subprocess.Popen([sys.executable,'-B',str(r/'plant.py'),str(r)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print(str(p.pid)+' '+str(os.get_inheritable(held.fileno())),flush=True)
p.wait()
''')
    parent = subprocess.Popen([sys.executable, '-B', str(root/'holder.py'), folder],
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    child = None
    try:
        pid, inherit = parent.stdout.readline().strip().split()
        child = int(pid)
        deadline = time.monotonic() + 3
        while not (root/'ready').exists():
            assert time.monotonic() < deadline
            time.sleep(.01)
        parent.kill()
        parent.wait(timeout=3)
        os.kill(child, 0)
        code = "import sys;sys.path.insert(0,sys.argv[1]);import negative_lock as m;m.scratch_lock_path=lambda:sys.argv[1]+'/owned.lock';held=m.acquire_scratch_lock();print('CONTENDER_ACQUIRED')"
        contender = subprocess.run([sys.executable, '-B', '-c', code, folder],
                                   capture_output=True, text=True, timeout=3)
        os.kill(child, 0)
        (root/'go').write_text('go')
        deadline = time.monotonic() + 3
        while not (root/'late-write').exists():
            assert time.monotonic() < deadline
            time.sleep(.01)
        print(json.dumps({'source': source, 'helper_sha256': hashlib.sha256(helper).hexdigest(),
            'holder_descriptor_inheritable': inherit == 'True', 'parent_exit': parent.returncode,
            'contender_exit': contender.returncode, 'contender_stdout': contender.stdout,
            'original_child_alive_after_contender_admission': True,
            'original_child_wrote_after_contender_admission': (root/'late-write').read_text()}))
    finally:
        if parent.poll() is None:
            parent.kill()
            parent.wait()
        if child and not (root/'late-write').exists():
            try:
                os.kill(child, signal.SIGKILL)
            except ProcessLookupError:
                pass
