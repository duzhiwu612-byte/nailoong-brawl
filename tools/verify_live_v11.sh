#!/usr/bin/env bash
# v0.11.0 线上终验：等 Pages 重建 → 公网实拍设计五连（转场/开场/残血）+ flow 逻辑 → 像素 QC
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
LIVE="https://duzhiwu612-byte.github.io/nailoong-brawl"
DES="$T/nl7_design"
mkdir -p "$DES"

echo "== 1. 等 Pages 重建（轮询线上 main.js / battle.js / effects.js）=="
ok=0
for i in $(seq 1 30); do
  v=$(curl -s "$LIVE/js/main.js" | grep -c "v0.11.0 (M13)")
  b=$(curl -s "$LIVE/js/battle.js" | grep -c "introOffset")
  e=$(curl -s "$LIVE/js/effects.js" | grep -c "spawnRunDust")
  echo "try$i: main=$v battle=$b effects=$e"
  if [ "$v" -ge 1 ] && [ "$b" -ge 1 ] && [ "$e" -ge 1 ]; then ok=1; break; fi
  sleep 20
done
if [ "$ok" != "1" ]; then echo "✘ 超时未见 v0.11.0"; exit 1; fi
echo "✔ 线上已是 v0.11.0（转场 + 开场演出 + 跑动尘 均在线上）"

echo ""
echo "== 2. 公网实拍（标题 / 转场 / 开场 / 对照 / 残血 / flow）=="
shoot() {
  "$CHROME" --headless=new --disable-gpu --no-first-run \
    --enable-logging=stderr --v=0 --window-size=1280,720 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=22000 \
    --screenshot="$T/nl7_$1.png" "$LIVE/tools/browsercheck.html#$1" > "$T/nl7_$1.log" 2>&1
}
for scene in title trans intro intro2 lowhp flow; do
  shoot "$scene"
  echo "--- $scene ---"
  grep -a -o -E '"\[BROWSERCHECK\] (flow-|intro[:2]?|trans|lowhp|errors)[^"]*"' "$T/nl7_$scene.log" | head -8 || true
done
grep -a -o 'FLOW-DONE[^"]*' "$T/nl7_flow.log" | head -2 || true

echo ""
echo "== 3. 公网截图像素 QC =="
cp "$T/nl7_title.png"  "$DES/设计_0_标题对照.png"
cp "$T/nl7_intro.png"  "$DES/设计_1_开场下落.png"
cp "$T/nl7_intro2.png" "$DES/设计_2_开场对照.png"
cp "$T/nl7_trans.png"  "$DES/设计_3_转场淡出.png"
cp "$T/nl7_lowhp.png"  "$DES/设计_4_残血脉冲.png"
NL_DESIGN_DIR="$DES" python tools/probe_design.py
