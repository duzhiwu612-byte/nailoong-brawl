#!/usr/bin/env bash
# v0.13.0 线上终验：等 Pages 重建 → 公网新机制实拍 + 像素 QC → 公网双进程真实联机
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
LIVE="https://duzhiwu612-byte.github.io/nailoong-brawl"
DES="$T/nlB_design"
mkdir -p "$DES"

echo "== 1. 等 Pages 重建（轮询线上脚本特征串）=="
ok=0
for i in $(seq 1 30); do
  v=$(curl -s "$LIVE/js/main.js" | grep -c "v0.13.0 (M16)")
  s=$(curl -s "$LIVE/js/characters.js" | grep -c "slimX")
  b=$(curl -s "$LIVE/js/battle.js" | grep -c "boardshield")
  m=$(curl -s "$LIVE/js/battle.js" | grep -c "smokeBoom")
  echo "try$i: main=$v slim=$s board=$b smoke=$m"
  if [ "$v" -ge 1 ] && [ "$s" -ge 1 ] && [ "$b" -ge 1 ] && [ "$m" -ge 1 ]; then ok=1; break; fi
  sleep 20
done
if [ "$ok" != "1" ]; then echo "✘ 超时未见 v0.13.0"; exit 1; fi
echo "✔ 线上已是 v0.13.0（瘦身/盾/烟雾/香蕉雨/手机堆 均在线上）"

echo ""
echo "== 2. 公网场景实拍（v0.13 新机制 + 关键回归）=="
shoot() {
  "$CHROME" --headless=new --disable-gpu --no-first-run \
    --enable-logging=stderr --v=0 --window-size=1280,720 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=20000 \
    --screenshot="$T/nlB_$1.png" "$LIVE/tools/browsercheck.html#$1" > "$T/nlB_$1.log" 2>&1
}
for scene in board2 smoke1 smokefire rain2 pile2 burn2 newsel bottle2 flip getupinv kugua laobai; do
  shoot "$scene"
  echo "--- $scene ---"
  grep -a -o -E '"\['"BROWSERCHECK"'\][^"]*(：|:)[^"]*"' "$T/nlB_$scene.log" 2>/dev/null | grep -v "scene ->" | head -4 || true
done

cp "$T/nlB_board2.png"    "$DES/班友_16_黑板之盾.png"
cp "$T/nlB_smoke1.png"    "$DES/班友_17_迷雾战场.png"
cp "$T/nlB_smokefire.png" "$DES/班友_18_烟雾大爆炸.png"
cp "$T/nlB_rain2.png"     "$DES/班友_19_全屏香蕉雨.png"
cp "$T/nlB_pile2.png"     "$DES/班友_20_手机堆挡路.png"
cp "$T/nlB_burn2.png"     "$DES/班友_21_灼烧状态.png"
cp "$T/nlB_newsel.png"    "$DES/班友_9_选人阵容.png"
cp "$T/nlB_bottle2.png"   "$DES/班友_10_酒瓶炸开水渍.png"
cp "$T/nlB_getupinv.png"  "$DES/班友_12_起身无敌.png"
cp "$T/nlB_kugua.png"     "$DES/班友_1_香蕉抛物.png"
cp "$T/nlB_laobai.png"    "$DES/班友_7_火柱水渍.png"
echo ""
echo "== 3. 公网截图像素 QC =="
NL_NEW5_DIR="$DES" python tools/probe_new5.py

echo ""
echo "== 4. 公网双进程真实联机（部署版 netcheck）=="
CODE="QL$(( RANDOM % 90 + 10 ))$(( RANDOM % 90 + 10 ))"
rm -f "$T/nlB_vnet_host.log" "$T/nlB_vnet_guest.log"
rm -rf "$T/nlB_c1" "$T/nlB_c2"
timeout 60 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlB_c1" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$LIVE/tools/netcheck.html?role=host&code=$CODE&frames=400" > "$T/nlB_vnet_host.log" 2>&1 &
HP=$!
sleep 2
timeout 60 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlB_c2" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$LIVE/tools/netcheck.html?role=guest&code=$CODE&frames=400" > "$T/nlB_vnet_guest.log" 2>&1 &
GP=$!
for i in $(seq 1 75); do
  if grep -q "ALLDONE" "$T/nlB_vnet_host.log" 2>/dev/null && grep -q "ALLDONE" "$T/nlB_vnet_guest.log" 2>/dev/null; then
    echo "   两端均完成（等待 $i 秒）"; break
  fi
  sleep 1
done
kill $HP $GP 2>/dev/null
wait 2>/dev/null
HH=$(grep -oE "DONE role=host frames=[0-9]+ hash=-?[0-9]+" "$T/nlB_vnet_host.log" | head -1)
GH=$(grep -oE "DONE role=guest frames=[0-9]+ hash=-?[0-9]+" "$T/nlB_vnet_guest.log" | head -1)
HASH_H=$(echo "$HH" | grep -oE "hash=-?[0-9]+")
HASH_G=$(echo "$GH" | grep -oE "hash=-?[0-9]+")
echo "   host:  $HH"
echo "   guest: $GH"
if [ -n "$HASH_H" ] && [ "$HASH_H" = "$HASH_G" ]; then
  echo "✅ 公网联机 LIVE-NET OK：$HASH_H"
else
  echo "❌ 公网联机 FAIL：host=$HASH_H guest=$HASH_G"
fi
