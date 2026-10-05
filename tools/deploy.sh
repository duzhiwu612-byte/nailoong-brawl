#!/usr/bin/env bash
# 奶龙大乱斗 GitHub Pages 一键部署 v2
# 网络自适应：每个请求 直连→各本地代理端口 依次重试（该网络 github.com 直连时通时断）
set -u
cd "/c/Users/hp/Documents/奶龙大乱斗" || { echo "PROJECT_DIR_MISSING"; exit 1; }
export GIT_TERMINAL_PROMPT=0

REPO="nailoong-brawl"
CLIENT_ID="178c6fc778ccc68e1d6a"
PORTS="7897 7890 7891 7892 10809 10808 1080 2080"

echo "==STEP0== 代理探测（两轮）..."
PROXY=""
for pass in 1 2; do
  for port in $PORTS; do
    R=$(curl -s -o /dev/null -w '%{http_code}' --max-time 6 -x "http://127.0.0.1:$port" https://github.com/favicon.ico 2>/dev/null)
    echo "  pass$pass port $port -> ${R:-empty}"
    case "$R" in 200|301|302) PROXY="http://127.0.0.1:$port"; break 2 ;; esac
  done
done
if [ -n "$PROXY" ]; then echo "PROXY_FOUND=$PROXY"; else echo "PROXY_NOT_FOUND（将全部直接/多路重试）"; fi

# ---------- 多路重试请求工具 ----------
oauth_post() { # $1=data  $2=url
  local out p
  out=$(curl -s --max-time 15 -X POST -H "Accept: application/json" -d "$1" "$2" 2>/dev/null)
  [ -n "$out" ] && { printf '%s' "$out"; return 0; }
  for p in $PORTS; do
    out=$(curl -s --max-time 15 -x "http://127.0.0.1:$p" -X POST -H "Accept: application/json" -d "$1" "$2" 2>/dev/null)
    [ -n "$out" ] && { printf '%s' "$out"; return 0; }
  done
  return 1
}
gh_api() { # $1=METHOD $2=URL [$3=data]
  local method="$1" url="$2" data="${3:-}" raw p
  local cargs=(-s -w '\nHTTP_CODE:%{http_code}' --max-time 30 -X "$method"
    -H "Authorization: token ${TOKEN}" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")
  [ -n "$data" ] && cargs+=(-d "$data")
  raw=$(curl "${cargs[@]}" "$url" 2>/dev/null)
  if ! printf '%s' "$raw" | grep -q "HTTP_CODE:"; then
    for p in $PORTS; do
      raw=$(curl "${cargs[@]}" -x "http://127.0.0.1:$p" "$url" 2>/dev/null)
      printf '%s' "$raw" | grep -q "HTTP_CODE:" && break
    done
  fi
  printf '%s' "$raw"
}
code_of() { printf '%s' "$1" | sed -n 's/.*HTTP_CODE:\([0-9]*\)$/\1/p'; }

echo "==STEP1== 请求设备码..."
RESP=$(oauth_post "client_id=${CLIENT_ID}&scope=repo,read:org,gist" https://github.com/login/device/code)
DEVICE_CODE=$(printf '%s' "$RESP" | sed 's/.*"device_code":"\([^"]*\)".*/\1/')
USER_CODE=$(printf '%s' "$RESP" | sed 's/.*"user_code":"\([^"]*\)".*/\1/')
INTERVAL=$(printf '%s' "$RESP" | sed 's/.*"interval":\([0-9]*\).*/\1/')
INTERVAL=${INTERVAL:-5}
if [ -z "$DEVICE_CODE" ] || [ "$DEVICE_CODE" = "$RESP" ] || [ -z "$USER_CODE" ]; then
  echo "DEVICE_CODE_FAIL: $RESP"; exit 1
fi
echo "USER_CODE=$USER_CODE"
echo "DEVICE_URL=https://github.com/login/device"
echo "==STEP2== 等待用户授权（网络抖动会自动重试）..."

TOKEN=""
FAILS=0
while true; do
  sleep "$INTERVAL"
  POLL=$(oauth_post "client_id=${CLIENT_ID}&device_code=${DEVICE_CODE}&grant_type=urn:ietf:params:oauth:grant-type:device_code" https://github.com/login/oauth/access_token)
  if [ -z "$POLL" ]; then
    FAILS=$((FAILS + 1)); echo "poll-empty x$FAILS"
    [ $FAILS -gt 60 ] && { echo "POLL_NETWORK_DEAD"; exit 1; }
    continue
  fi
  FAILS=0
  case "$POLL" in
    *access_token*) TOKEN=$(printf '%s' "$POLL" | sed 's/.*"access_token":"\([^"]*\)".*/\1/'); break ;;
    *authorization_pending*) echo "waiting..." ;;
    *slow_down*) INTERVAL=$((INTERVAL + 5)) ;;
    *expired_token*) echo "CODE_EXPIRED — RERUN"; exit 1 ;;
    *access_denied*) echo "USER_DENIED"; exit 1 ;;
    *) echo "poll-unknown: $(printf '%s' "$POLL" | head -c 120)" ;;
  esac
done
echo "AUTH_OK"

UINFO=$(gh_api GET https://api.github.com/user)
LOGIN=$(printf '%s' "$UINFO" | sed '$d' | python -c "import sys,json;print(json.load(sys.stdin)['login'])" 2>/dev/null)
UID=$(printf '%s' "$UINFO" | sed '$d' | python -c "import sys,json;print(json.load(sys.stdin)['id'])" 2>/dev/null)
[ -z "$LOGIN" ] && { echo "LOGIN_PARSE_FAIL: $UINFO"; exit 1; }
echo "LOGIN=${LOGIN}"

echo "==STEP3== 配置 git 凭据与身份..."
git config --global credential.helper store
printf 'https://%s:%s@github.com\n' "$LOGIN" "$TOKEN" > "$HOME/.git-credentials"
git config --global user.name "$LOGIN"
git config --global user.email "${UID}+${LOGIN}@users.noreply.github.com"

echo "==STEP4== 替换占位符并提交..."
sed -i "s/__GH_USER__/${LOGIN}/g" index.html README.md
if [ ! -d .git ]; then git init -b main >/dev/null; fi
git add -A
if git diff --cached --quiet; then
  echo "(没有新改动)"
else
  git commit -m "奶龙大乱斗 v0.7：奶娃九形态 + 手机横屏触控 + 原画级建模配色" >/dev/null && echo "commit ok"
fi

echo "==STEP5== 创建远程仓库..."
CREATE_RAW=$(gh_api POST https://api.github.com/user/repos "{\"name\":\"${REPO}\",\"description\":\"《奶龙大乱斗》- 纯 HTML5 奶娃九形态同人格斗小游戏（学习娱乐·非商用）：九形态×专属招式+远程弹道+虚步穿人+多层平台+手机横屏触控\",\"homepage\":\"https://${LOGIN}.github.io/${REPO}/\",\"private\":false,\"has_issues\":true,\"has_wiki\":false,\"auto_init\":false}")
echo "create_repo_http=$(code_of "$CREATE_RAW")"

echo "==STEP6== 推送代码（直连→代理多路重试）..."
PUSHED=0
git remote remove origin 2>/dev/null || true
git remote add origin "https://${LOGIN}:${TOKEN}@github.com/${LOGIN}/${REPO}.git"
if git push -u origin main > /tmp/nl_push.log 2>&1; then
  PUSHED=1; echo "push ok (direct)"
else
  tail -3 /tmp/nl_push.log
  for p in $PORTS; do
    if git -c http.proxy="http://127.0.0.1:$p" push -u origin main > /tmp/nl_push.log 2>&1; then
      PUSHED=1; echo "push ok (via proxy $p)"; break
    fi
  done
fi
[ "$PUSHED" = "0" ] && { echo "PUSH_FAILED"; tail -5 /tmp/nl_push.log; }
git remote set-url origin "https://github.com/${LOGIN}/${REPO}.git"

echo "==STEP7== 开启 GitHub Pages..."
PAGES_RAW=$(gh_api POST "https://api.github.com/repos/${LOGIN}/${REPO}/pages" '{"source":{"branch":"main","path":"/"}}')
echo "enable_pages_http=$(code_of "$PAGES_RAW")"

echo "==STEP8== 等待构建并验证..."
URL="https://${LOGIN}.github.io/${REPO}/"
OK=0
for i in $(seq 1 40); do
  sleep 10
  HC=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 20 "$URL")
  echo "check $i: http=$HC"
  if [ "$HC" = "200" ]; then OK=1; break; fi
done
if [ "$OK" = "1" ]; then
  JSC=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/js/main.js")
  PTC=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/%E7%AB%8B%E7%BB%98/loving.png")
  COVC=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/share-cover.jpg")
  echo "asset_check js=$JSC portrait=$PTC cover=$COVC"
fi
echo "==DONE=="
echo "SITE_URL=${URL}"
echo "REPO_URL=https://github.com/${LOGIN}/${REPO}"
