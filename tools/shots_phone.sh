#!/usr/bin/env bash
# 看笑了·手机弹道截图 + QC
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
BASE="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97"

echo "== 手机弹道定格（K 直抛 + U 回旋，飞行中）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=8000 --window-size=1280,720 \
  --screenshot="$T/nl_check_phone.png" \
  "$BASE/tools/browsercheck.html#phones" 2>&1 | grep -oE "\[BROWSERCHECK\][^\"]*" | head -20

echo ""
echo "== 像素核查 =="
.venv-gfx/Scripts/python.exe tools/probe_phone.py
