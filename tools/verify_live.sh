#!/usr/bin/env bash
# 对线上地址做无头浏览器验证（控制台日志 + 截图）
# 用法: bash tools/verify_live.sh https://xxx.github.io/nailoong-brawl/
URL="${1:?usage: bash tools/verify_live.sh <site-url>}"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
TMP="$LOCALAPPDATA/Temp"

echo "=== [1/2] 首页加载 ==="
"$CHROME" --headless=new --disable-gpu --no-first-run --enable-logging=stderr --v=0 \
  --window-size=1280,720 --virtual-time-budget=18000 \
  --screenshot="$TMP/live_title.png" "$URL" 2>&1 | grep -iE "CONSOLE|error" | head -15
echo "(截图: $TMP/live_title.png)"

echo ""
echo "=== [2/2] 全流程自检页（应显示 portraits 7/7 且 errors=0）==="
"$CHROME" --headless=new --disable-gpu --no-first-run --enable-logging=stderr --v=0 \
  --window-size=1280,720 --virtual-time-budget=25000 \
  --screenshot="$TMP/live_check.png" "$URL/tools/browsercheck.html#navtest" 2>&1 | grep -oE "\[BROWSERCHECK\][^\"]*" | head -30
echo "(截图: $TMP/live_check.png)"
