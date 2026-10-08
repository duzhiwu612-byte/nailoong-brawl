# -*- coding: utf-8 -*-
"""用 GitHub Git Data API 推送本地提交（代理不可用但 api.github.com 可达时的应急方案）
   流程: 读远端 tree → 与本地 HEAD 逐文件比对 blob sha → blobs → tree(base_tree=远端) → commit(parent=远端) → 更新 ref → 验证
   幂等：远端内容已等于本地时直接跳过。远端合成 commit 无需在本地对象库（纯内容寻址比对）。"""
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
print('local =', local_head)

remote_head = api('GET', '/repos/%s/git/ref/heads/main' % REPO)['object']['sha']
print('remote=', remote_head)
if local_head == remote_head:
    print('ALREADY_IN_SYNC')
    sys.exit(0)

# —— 远端文件清单（tree API，blob sha 内容寻址；无需本地对象库）——
rcommit = api('GET', '/repos/%s/git/commits/%s' % (REPO, remote_head))
rtree = api('GET', '/repos/%s/git/trees/%s?recursive=1' % (REPO, rcommit['tree']['sha']))
remote_files = {}
for e in rtree.get('tree', []):
    if e['type'] == 'blob':
        remote_files[e['path']] = e['sha']
if rtree.get('truncated'):
    print('!! 警告：远端 tree 列表被截断（本仓库很小，一般不会发生）')

# —— 本地文件清单 ——
local_files = {}
for line in sh(['git', '-c', 'core.quotepath=false', 'ls-tree', '-r', local_head]).splitlines():
    meta, path = line.split('\t', 1)
    mode, typ, sha = meta.split()
    if typ == 'blob':
        local_files[path] = sha

changed = sorted(p for p in local_files if remote_files.get(p) != local_files[p])
deleted = sorted(p for p in remote_files if p not in local_files)
if not changed and not deleted:
    print('ALREADY_IN_SYNC（内容一致，仅 commit sha 不同）')
    sys.exit(0)
print('变更 %d 个文件（删除 %d 个）' % (len(changed), len(deleted)))

entries = []
for p in changed:
    content = sh(['git', 'show', '%s:%s' % (local_head, p)], binary=True)
    blob = api('POST', '/repos/%s/git/blobs' % REPO, {
        'content': base64.b64encode(content).decode('ascii'), 'encoding': 'base64'})
    lst = sh(['git', 'ls-tree', local_head, '--', p]).strip()
    mode = lst.split()[0] if lst else '100644'
    entries.append({'path': p, 'mode': mode, 'type': 'blob', 'sha': blob['sha']})
    print('  M  %-46s %6d B' % (p, len(content)))
for p in deleted:
    entries.append({'path': p, 'mode': '100644', 'type': 'blob', 'sha': None})
    print('  D  %s' % p)

base_tree = rcommit['tree']['sha']
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
