#!/usr/bin/env bash
# 通用一键发布：把本地静态目录发布到 GitHub Pages（自动建仓库/推送/开 Pages/验证）
# 用法: bash tools/gh_deploy_now.sh <目录> <仓库名> <提交信息>
set -u
DIR="$1"; REPO="$2"; MSG="${3:-deploy}"
PROXY="http://127.0.0.1:7897"
cd "$DIR" || { echo "DIR_MISSING: $DIR"; exit 1; }

TOKEN=$(sed -n 's|^https://[^:]*:\(.*\)@github.com$|\1|p' "$HOME/.git-credentials" | head -1)
if [ -z "$TOKEN" ]; then echo "NO_TOKEN"; exit 1; fi
LOGIN=$(curl -s --max-time 30 -H "Authorization: token $TOKEN" https://api.github.com/user | python -c "import sys,json;print(json.load(sys.stdin)['login'])" 2>/dev/null)
if [ -z "$LOGIN" ]; then echo "LOGIN_FAIL"; exit 1; fi
echo "LOGIN=$LOGIN  REPO=$REPO  DIR=$DIR"

echo "== 1) 本地提交 =="
git config user.name "$LOGIN"
git config user.email "${LOGIN}@users.noreply.github.com"
git add -A
if git diff --cached --quiet 2>/dev/null; then
  echo "(工作区干净，跳过提交)"
else
  git commit -q -m "$MSG" && echo "commit ok"
fi
git branch -M main

echo "== 2) 创建远程仓库（存在则跳过）=="
HC=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -H "Authorization: token $TOKEN" "https://api.github.com/repos/$LOGIN/$REPO")
if [ "$HC" = "200" ]; then
  echo "repo_exists"
else
  CR=$(curl -s --max-time 30 -X POST -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
    https://api.github.com/user/repos -d "{\"name\":\"$REPO\",\"private\":false,\"auto_init\":false}")
  echo "create_resp: $(printf '%s' "$CR" | head -c 110)"
fi

echo "== 3) 推送（经代理 7897）=="
git remote remove origin 2>/dev/null || true
git remote add origin "https://${LOGIN}:${TOKEN}@github.com/${LOGIN}/${REPO}.git"
if git -c http.proxy="$PROXY" -c https.proxy="$PROXY" push -u origin main > "$LOCALAPPDATA/Temp/push_${REPO}.log" 2>&1; then
  echo "push ok"
else
  echo "push FAIL:"; tail -5 "$LOCALAPPDATA/Temp/push_${REPO}.log"
fi
git remote set-url origin "https://github.com/${LOGIN}/${REPO}.git"

echo "== 4) 开启 Pages =="
PC=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$LOGIN/$REPO/pages" -d '{"source":{"branch":"main","path":"/"}}')
echo "pages_enable_http=$PC （201=已开启 / 409=已开启过）"

echo "== 5) 等构建并验证 =="
URL="https://${LOGIN}.github.io/${REPO}/"
OK=0
for i in $(seq 1 30); do
  sleep 8
  C=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 "$URL")
  if [ "$C" != "200" ]; then
    C=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 -x "$PROXY" "$URL")
  fi
  echo "check $i: $C"
  [ "$C" = "200" ] && { OK=1; break; }
done
if [ "$OK" = "1" ]; then
  TITLE=$(curl -s -L --max-time 15 "$URL" | grep -o "<title>[^<]*</title>" | head -1)
  echo "SITE_URL=$URL"
  echo "TITLE=$TITLE"
else
  echo "SITE_NOT_READY=$URL （构建可能还在进行，稍后刷新即可）"
fi
