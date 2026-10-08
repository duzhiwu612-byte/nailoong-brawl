#!/usr/bin/env bash
# 胜利宣言截图 + QC（「看笑了」气泡 / 获胜播报 / 结算浮层）
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
BASE="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97"

echo "== ① roundEnd 定格（胜利气泡 + 播报）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=8000 --window-size=1280,720 \
  --screenshot="$T/nl_check_winquote.png" \
  "$BASE/tools/browsercheck.html#winquote" 2>&1 | grep -oE "\[BROWSERCHECK\][^\"]*" | head -20

echo "== ② matchEnd 定格（结算浮层宣言）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=8000 --window-size=1280,720 \
  --screenshot="$T/nl_check_winquote2.png" \
  "$BASE/tools/browsercheck.html#winquote2" 2>&1 | grep -oE "\[BROWSERCHECK\][^\"]*" | head -20

echo ""
echo "== 像素核查 =="
.venv-gfx/Scripts/python.exe tools/probe_winquote.py
