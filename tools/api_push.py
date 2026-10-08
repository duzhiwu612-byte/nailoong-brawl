# -*- coding: utf-8 -*-
"""用 GitHub Git Data API 推送本地提交（代理不可用但 api.github.com 可达时的应急方案）
   流程: blobs → tree(base_tree=远端) → commit(parent=远端) → 更新 ref → 验证
   幂等：远端已等于本地时直接跳过。"""
import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

REPO = 'duzhiwu612-byte/nailoong-brawl'
API = 'https://api.github.com'
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

def sh(cmd, binary=False):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError('cmd fail: %s\n%s' % (cmd, r.stderr.decode('utf-8', 'replace')))
    return r.stdout if binary else r.stdout.decode('utf-8', 'replace')

def load_token():
    with open(os.path.expanduser('~/.git-credentials'), 'r', encoding='utf-8') as f:
        for line in f:
            m = re.match(r'https://[^:]*:(.+)@github\.com\s*$', line.strip())
            if m:
                return m.group(1)
    raise RuntimeError('no token in .git-credentials')

TOKEN = load_token()
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # 直连，忽略代理环境变量

def api(method, path, data=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header('Authorization', 'token ' + TOKEN)
    req.add_header('Accept', 'application/vnd.github+json')
    req.add_header('User-Agent', 'nailoong-push')
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    try:
        with OPENER.open(req, data=body, timeout=60) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        raise RuntimeError('HTTP %d on %s %s: %s' % (e.code, method, path, e.read()[:300]))

local_head = sh(['git', 'rev-parse', 'HEAD']).strip()
remote_head = api('GET', '/repos/%s/git/ref/heads/main' % REPO)['object']['sha']
print('local =', local_head)
print('remote=', remote_head)
if local_head == remote_head:
    print('ALREADY_IN_SYNC')
    sys.exit(0)
try:
    sh(['git', 'cat-file', '-t', remote_head])
except Exception:
    print('!! 远端 %s 不在本地对象库，需先 fetch 对齐' % remote_head)
    sys.exit(2)

status = sh(['git', '-c', 'core.quotepath=false', 'diff-tree', '-r', '--name-status', remote_head, local_head])
changes = []
for line in status.splitlines():
    if not line.strip():
        continue
    parts = line.split('\t')
    changes.append((parts[0], parts[-1]))
print('变更 %d 个文件' % len(changes))

entries = []
for st, path in changes:
    if st == 'D':
        entries.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': None})
        print('  D  %s' % path)
        continue
    content = sh(['git', 'show', '%s:%s' % (local_head, path)], binary=True)
    blob = api('POST', '/repos/%s/git/blobs' % REPO, {
        'content': base64.b64encode(content).decode('ascii'), 'encoding': 'base64'})
    lst = sh(['git', 'ls-tree', local_head, '--', path]).strip()
    mode = lst.split()[0] if lst else '100644'
    entries.append({'path': path, 'mode': mode, 'type': 'blob', 'sha': blob['sha']})
    print('  %s  %-46s %6d B' % (st, path, len(content)))

base_tree = api('GET', '/repos/%s/git/commits/%s' % (REPO, remote_head))['tree']['sha']
tree = api('POST', '/repos/%s/git/trees' % REPO, {'base_tree': base_tree, 'tree': entries})
msg = sh(['git', 'log', '-1', '--format=%B', local_head]).strip() or 'update'
commit = api('POST', '/repos/%s/git/commits' % REPO, {
    'message': msg, 'tree': tree['sha'], 'parents': [remote_head]})
print('new commit =', commit['sha'])
upd = api('PATCH', '/repos/%s/git/refs/heads/main' % REPO, {'sha': commit['sha'], 'force': False})
print('ref ->', upd['object']['sha'])
check = api('GET', '/repos/%s/git/ref/heads/main' % REPO)['object']['sha']
print('VERIFY', 'OK' if check == commit['sha'] else 'MISMATCH')
print('提示：代理恢复后本地对齐执行  git fetch origin && git reset --hard origin/main')
