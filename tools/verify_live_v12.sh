#!/usr/bin/env bash
# v0.12.0 线上终验：等 Pages 重建 → 公网班友 9 场景实拍 + 像素 QC → 公网双进程真实联机
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
LIVE="https://duzhiwu612-byte.github.io/nailoong-brawl"
DES="$T/nl9_design"
mkdir -p "$DES"

echo "== 1. 等 Pages 重建（轮询线上脚本特征串）=="
ok=0
for i in $(seq 1 30); do
  v=$(curl -s "$LIVE/js/main.js" | grep -c "v0.12.0 (M14)")
  c=$(curl -s "$LIVE/js/characters.js" | grep -c "kugua")
  f=$(curl -s "$LIVE/js/fighter.js" | grep -c "trySubstitute")
  n=$(curl -s "$LIVE/js/net.js" | grep -c "fastly.jsdelivr.net")
  echo "try$i: main=$v chars=$c fighter=$f net=$n"
  if [ "$v" -ge 1 ] && [ "$c" -ge 1 ] && [ "$f" -ge 1 ] && [ "$n" -ge 1 ]; then ok=1; break; fi
  sleep 20
done
if [ "$ok" != "1" ]; then echo "✘ 超时未见 v0.12.0"; exit 1; fi
echo "✔ 线上已是 v0.12.0（班友 + 替身 + CDN 修复 均在线上）"

echo ""
echo "== 2. 公网班友 9 场景实拍 =="
shoot() {
  "$CHROME" --headless=new --disable-gpu --no-first-run \
    --enable-logging=stderr --v=0 --window-size=1280,720 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=22000 \
    --screenshot="$T/nl9_$1.png" "$LIVE/tools/browsercheck.html#$1" > "$T/nl9_$1.log" 2>&1
}
for scene in kugua kuguap kuguaslip laser tallguy jiuyi laobai subst newsel; do
  shoot "$scene"
  echo "--- $scene ---"
  grep -a -o -E '"\[BROWSERCHECK\] [^"]*(kugua|kuguap|kuguaslip|laser|tallguy|jiuyi|laobai|subst|newsel|headImg|errors)[^"]*"' "$T/nl9_$scene.log" | grep -v "scene ->" | head -4 || true
done

cp "$T/nl9_kugua.png"    "$DES/班友_1_香蕉抛物.png"
cp "$T/nl9_kuguap.png"   "$DES/班友_2_蕉皮留地.png"
cp "$T/nl9_kuguaslip.png" "$DES/班友_3_踩到香蕉皮.png"
cp "$T/nl9_laser.png"    "$DES/班友_4_镭射眼.png"
cp "$T/nl9_tallguy.png"  "$DES/班友_5_大高个对比.png"
cp "$T/nl9_jiuyi.png"    "$DES/班友_6_九一音波.png"
cp "$T/nl9_laobai.png"   "$DES/班友_7_火柱水渍.png"
cp "$T/nl9_subst.png"    "$DES/班友_8_替身木桩.png"
cp "$T/nl9_newsel.png"   "$DES/班友_9_选人阵容.png"
echo ""
echo "== 3. 公网截图像素 QC =="
NL_NEW5_DIR="$DES" python tools/probe_new5.py

echo ""
echo "== 4. 公网双进程真实联机（部署版 netcheck）=="
CODE="QL$(( RANDOM % 90 + 10 ))$(( RANDOM % 90 + 10 ))"
rm -f "$T/nl9_vnet_host.log" "$T/nl9_vnet_guest.log"
rm -rf "$T/nl9_c1" "$T/nl9_c2"
timeout 60 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nl9_c1" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$LIVE/tools/netcheck.html?role=host&code=$CODE&frames=400" > "$T/nl9_vnet_host.log" 2>&1 &
HP=$!
sleep 2
timeout 60 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nl9_c2" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$LIVE/tools/netcheck.html?role=guest&code=$CODE&frames=400" > "$T/nl9_vnet_guest.log" 2>&1 &
GP=$!
for i in $(seq 1 75); do
  if grep -q "ALLDONE" "$T/nl9_vnet_host.log" 2>/dev/null && grep -q "ALLDONE" "$T/nl9_vnet_guest.log" 2>/dev/null; then
    echo "   两端均完成（等待 $i 秒）"; break
  fi
  sleep 1
done
kill $HP $GP 2>/dev/null
wait 2>/dev/null
HH=$(grep -oE "DONE role=host frames=[0-9]+ hash=-?[0-9]+" "$T/nl9_vnet_host.log" | head -1)
GH=$(grep -oE "DONE role=guest frames=[0-9]+ hash=-?[0-9]+" "$T/nl9_vnet_guest.log" | head -1)
HASH_H=$(echo "$HH" | grep -oE "hash=-?[0-9]+")
HASH_G=$(echo "$GH" | grep -oE "hash=-?[0-9]+")
echo "   host:  $HH"
echo "   guest: $GH"
if [ -n "$HASH_H" ] && [ "$HASH_H" = "$HASH_G" ]; then
  echo "✅ 公网联机 LIVE-NET OK：$HASH_H"
else
  echo "❌ 公网联机 FAIL：host=$HASH_H guest=$HASH_G"
fi
