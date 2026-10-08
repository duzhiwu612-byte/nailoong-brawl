#!/usr/bin/env bash
# 线上终验：等待 Pages 重建 → 公网截"旧手机山"两幕 → 像素核查
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
U="https://duzhiwu612-byte.github.io/nailoong-brawl"

echo "== 等待 Pages 重建 =="
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  MA=$(curl -s --max-time 15 "$U/js/main.js" | grep -c "v0.9.2")
  PH=$(curl -s --max-time 15 "$U/js/battle.js" | grep -c "phonemountain")
  XL=$(curl -s --max-time 15 "$U/js/characters.js" | grep -c "天降旧手机山")
  echo "try$i: v0.9.2=$MA phonemountain=$PH 天降旧手机山=$XL"
  if [ "$MA" -ge 1 ] && [ "$PH" -ge 2 ] && [ "$XL" -ge 1 ]; then ok=1; echo "REBUILD-OK"; break; fi
  sleep 12
done
[ "$ok" = "1" ] || { echo "重建未完成，退出"; exit 1; }

echo ""
echo "== 公网 ① 旧手机山（下坠定格）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=9000 --window-size=1280,720 \
  --screenshot="$T/nl_check_mountain.png" \
  "$U/tools/browsercheck.html#mountain" 2>&1 | grep -oE "\[BROWSERCHECK\][^\"]*" | head -8

echo "== 公网 ② 爆机散落（砸中后定格）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=9000 --window-size=1280,720 \
  --screenshot="$T/nl_check_mountain2.png" \
  "$U/tools/browsercheck.html#mountain2" 2>&1 | grep -oE "\[BROWSERCHECK\][^\"]*" | head -8

echo ""
echo "== 公网截图像素核查 =="
.venv-gfx/Scripts/python.exe tools/probe_mountain.py
