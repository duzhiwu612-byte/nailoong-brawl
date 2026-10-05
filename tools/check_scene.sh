#!/usr/bin/env bash
# 单场景无头检查：抓 BROWSERCHECK 日志（用法: bash tools/check_scene.sh gallery）
SCENE="${1:-gallery}"
cd "/c/Users/hp/Documents/奶龙大乱斗"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --window-size=1280,720 --virtual-time-budget=22000 \
  --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling \
  --screenshot="$LOCALAPPDATA/Temp/nl_check_$SCENE.png" \
  "file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97/tools/browsercheck.html#$SCENE" 2>&1 \
  | grep -oE "\[BROWSERCHECK\][^\"]*" | head -25
echo "(截图: $LOCALAPPDATA/Temp/nl_check_$SCENE.png)"
