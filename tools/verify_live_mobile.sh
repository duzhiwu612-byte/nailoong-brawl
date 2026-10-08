#!/usr/bin/env bash
# 线上终验 v0.9.3：等待 Pages 重建 → 公网触屏自检 + 公网竖屏截图（一键横屏按钮）
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
U="https://duzhiwu612-byte.github.io/nailoong-brawl"

echo "== 等待 Pages 重建 =="
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  MA=$(curl -s --max-time 15 "$U/js/main.js" | grep -c "v0.9.4")
  TC=$(curl -s --max-time 15 "$U/js/touch.js" | grep -c "rot-on")
  echo "try$i: v0.9.4=$MA rot-on=$TC"
  if [ "$MA" -ge 1 ] && [ "$TC" -ge 2 ]; then ok=1; echo "REBUILD-OK"; break; fi
  sleep 12
done
[ "$ok" = "1" ] || { echo "重建未完成，退出"; exit 1; }

echo ""
echo "== 公网触屏自检（?touch=1）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=5000 \
  --screenshot="$T/nl_live_touch.png" \
  "$U/tools/touchcheck.html?touch=1" 2>&1 | grep -oE "\[TOUCHCHECK\][^\"]*" | tail -8

echo ""
echo "== 公网竖屏截图（一键横屏按钮）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --window-size=390,844 --virtual-time-budget=8000 --run-all-compositor-stages-before-draw \
  --screenshot="$T/nl_live_portrait.png" "$U/index.html?touch=1" >/dev/null 2>&1
if [ -f "$T/nl_live_portrait.png" ]; then
  cp "$T/nl_live_portrait.png" "预览截图/手机_5_公网竖屏自动横屏.png"
  rm -f "预览截图/手机_5_公网竖屏一键横屏.png"
  echo "  ok -> 预览截图/手机_5_公网竖屏自动横屏.png"
else
  echo "  FAIL 截图"
fi
