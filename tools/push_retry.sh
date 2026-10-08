#!/usr/bin/env bash
# 重试推送 + 远端验证（直连 → 各本地代理端口）
set -u
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
TOKEN=$(sed -n 's|^https://[^:]*:\(.*\)@github.com$|\1|p' "$HOME/.git-credentials" | head -1)
if [ -z "$TOKEN" ]; then echo "NO_TOKEN"; exit 1; fi
URL="https://duzhiwu612-byte:${TOKEN}@github.com/duzhiwu612-byte/nailoong-brawl.git"

echo "== 连通性探测 =="
D=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 https://github.com/favicon.ico)
echo "直连 github.com: $D"
for p in 7897 7890 7891 7892 10809 10808 1080 2080; do
  R=$(curl -s -o /dev/null -w '%{http_code}' --max-time 4 -x "http://127.0.0.1:$p" https://github.com/favicon.ico 2>/dev/null)
  echo "代理 $p: ${R:-连不上}"
done

echo ""
echo "== 推送尝试 =="
OK=0
if git push "$URL" main 2>"$LOCALAPPDATA/Temp/push_try.log"; then
  echo "PUSH_OK (直连)"; OK=1
else
  echo "直连失败: $(tail -1 "$LOCALAPPDATA/Temp/push_try.log")"
  for p in 7897 7890 7891 7892 10809 10808 1080 2080; do
    if git -c http.proxy="http://127.0.0.1:$p" -c https.proxy="http://127.0.0.1:$p" push "$URL" main 2>"$LOCALAPPDATA/Temp/push_try.log"; then
      echo "PUSH_OK (代理 $p)"; OK=1; break
    else
      echo "代理 $p 失败: $(tail -1 "$LOCALAPPDATA/Temp/push_try.log")"
    fi
  done
fi
git remote set-url origin "https://github.com/duzhiwu612-byte/nailoong-brawl.git" 2>/dev/null || true

echo ""
echo "== 远端验证 =="
LOCAL=$(git rev-parse HEAD)
REMOTE=$(curl -s --max-time 20 -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/duzhiwu612-byte/nailoong-brawl/commits/main \
  | python -c "import sys,json;print(json.load(sys.stdin).get('sha',''))" 2>/dev/null)
echo "local =$LOCAL"
echo "remote=$REMOTE"
if [ "$LOCAL" = "$REMOTE" ]; then echo "VERIFY_OK 远端已是最新"; else echo "VERIFY_MISMATCH 远端未更新妥"; fi
