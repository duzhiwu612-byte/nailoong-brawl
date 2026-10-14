#!/usr/bin/env bash
# v0.12.1 线上终验：等 Pages 重建 → 公网修正项实拍 + 像素 QC → 公网双进程真实联机
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
LIVE="https://duzhiwu612-byte.github.io/nailoong-brawl"
DES="$T/nlA_design"
mkdir -p "$DES"

echo "== 1. 等 Pages 重建（轮询线上脚本特征串）=="
ok=0
for i in $(seq 1 30); do
  v=$(curl -s "$LIVE/js/main.js" | grep -c "v0.12.1 (M15)")
  f=$(curl -s "$LIVE/js/main.js" | grep -c "headFlip")
  b=$(curl -s "$LIVE/js/battle.js" | grep -c "burstBottle")
  c=$(curl -s "$LIVE/js/characters.js" | grep -c "maxHp: 1150")
  echo "try$i: main=$v flip=$f burst=$b hp=$c"
  if [ "$v" -ge 1 ] && [ "$f" -ge 1 ] && [ "$b" -ge 1 ] && [ "$c" -ge 1 ]; then ok=1; break; fi
  sleep 20
done
if [ "$ok" != "1" ]; then echo "✘ 超时未见 v0.12.1"; exit 1; fi
echo "✔ 线上已是 v0.12.1（翻转 + 炸瓶 + 血量 + 起身无敌 均在线上）"

echo ""
echo "== 2. 公网 12 场景实拍（含 v0.12.1 新场景）=="
shoot() {
  "$CHROME" --headless=new --disable-gpu --no-first-run \
    --enable-logging=stderr --v=0 --window-size=1280,720 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=22000 \
    --screenshot="$T/nlA_$1.png" "$LIVE/tools/browsercheck.html#$1" > "$T/nlA_$1.log" 2>&1
}
for scene in kugua kuguap kuguaslip laser tallguy jiuyi laobai subst newsel bottle2 flip getupinv; do
  shoot "$scene"
  echo "--- $scene ---"
  grep -a -o -E '"\['"BROWSERCHECK"'\][^"]*(：|:)[^"]*"' "$T/nlA_$scene.log" 2>/dev/null | grep -v "scene ->" | head -5 || true
done

cp "$T/nlA_kugua.png"    "$DES/班友_1_香蕉抛物.png"
cp "$T/nlA_kuguap.png"   "$DES/班友_2_蕉皮留地.png"
cp "$T/nlA_kuguaslip.png" "$DES/班友_3_踩到香蕉皮.png"
cp "$T/nlA_laser.png"    "$DES/班友_4_镭射眼.png"
cp "$T/nlA_tallguy.png"  "$DES/班友_5_大高个对比.png"
cp "$T/nlA_jiuyi.png"    "$DES/班友_6_九一音波.png"
cp "$T/nlA_laobai.png"   "$DES/班友_7_火柱水渍.png"
cp "$T/nlA_subst.png"    "$DES/班友_8_替身木桩.png"
cp "$T/nlA_newsel.png"   "$DES/班友_9_选人阵容.png"
cp "$T/nlA_bottle2.png"  "$DES/班友_10_酒瓶炸开水渍.png"
echo ""
echo "== 3. 公网截图像素 QC（12 项）=="
NL_NEW5_DIR="$DES" python tools/probe_new5.py

echo ""
echo "== 4. 公网双进程真实联机（部署版 netcheck）=="
CODE="QL$(( RANDOM % 90 + 10 ))$(( RANDOM % 90 + 10 ))"
rm -f "$T/nlA_vnet_host.log" "$T/nlA_vnet_guest.log"
rm -rf "$T/nlA_c1" "$T/nlA_c2"
timeout 60 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlA_c1" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$LIVE/tools/netcheck.html?role=host&code=$CODE&frames=400" > "$T/nlA_vnet_host.log" 2>&1 &
HP=$!
sleep 2
timeout 60 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlA_c2" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$LIVE/tools/netcheck.html?role=guest&code=$CODE&frames=400" > "$T/nlA_vnet_guest.log" 2>&1 &
GP=$!
for i in $(seq 1 75); do
  if grep -q "ALLDONE" "$T/nlA_vnet_host.log" 2>/dev/null && grep -q "ALLDONE" "$T/nlA_vnet_guest.log" 2>/dev/null; then
    echo "   两端均完成（等待 $i 秒）"; break
  fi
  sleep 1
done
kill $HP $GP 2>/dev/null
wait 2>/dev/null
HH=$(grep -oE "DONE role=host frames=[0-9]+ hash=-?[0-9]+" "$T/nlA_vnet_host.log" | head -1)
GH=$(grep -oE "DONE role=guest frames=[0-9]+ hash=-?[0-9]+" "$T/nlA_vnet_guest.log" | head -1)
HASH_H=$(echo "$HH" | grep -oE "hash=-?[0-9]+")
HASH_G=$(echo "$GH" | grep -oE "hash=-?[0-9]+")
echo "   host:  $HH"
echo "   guest: $GH"
if [ -n "$HASH_H" ] && [ "$HASH_H" = "$HASH_G" ]; then
  echo "✅ 公网联机 LIVE-NET OK：$HASH_H"
else
  echo "❌ 公网联机 FAIL：host=$HASH_H guest=$HASH_G"
fi
