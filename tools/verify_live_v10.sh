#!/usr/bin/env bash
# v0.10.0 线上终验：重建检查 → 公网双进程真实联机（PeerJS+WebRTC）→ 公网联机大厅截图
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
U="https://duzhiwu612-byte.github.io/nailoong-brawl"
CODE="LT$(( RANDOM % 90 + 10 ))$(( RANDOM % 90 + 10 ))"

echo "== 等待 Pages 重建 =="
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  MA=$(curl -s --max-time 15 "$U/js/main.js" | grep -c "v0.10.0")
  NE=$(curl -s --max-time 15 "$U/js/net.js" | grep -c "NetCore")
  CL=$(curl -s --max-time 15 "$U/js/battle.js" | grep -c "弹道对撞")
  echo "try$i: v0.10.0=$MA net.js=$NE 对撞=$CL"
  if [ "$MA" -ge 1 ] && [ "$NE" -ge 1 ] && [ "$CL" -ge 1 ]; then ok=1; echo "REBUILD-OK"; break; fi
  sleep 12
done
[ "$ok" = "1" ] || { echo "重建未完成，退出"; exit 1; }

echo ""
echo "== ① 公网·同页内存链路（600 帧确定性）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=10000 --user-data-dir="$T/nlc3" \
  --screenshot="$T/nl_live_netfake.png" \
  "$U/tools/netcheck.html?role=fake&frames=600" 2>&1 | grep -oE "\[NETCHECK\][^\"]*" | head -4

echo ""
echo "== ② 公网·双进程真实联机（code=$CODE）=="
rm -f "$T/live_host.log" "$T/live_guest.log"
timeout 50 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlc4" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$U/tools/netcheck.html?role=host&code=$CODE&frames=400" > "$T/live_host.log" 2>&1 &
HP=$!
sleep 2
timeout 50 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlc5" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$U/tools/netcheck.html?role=guest&code=$CODE&frames=400" > "$T/live_guest.log" 2>&1 &
GP=$!

for i in $(seq 1 60); do
  if grep -q "ALLDONE" "$T/live_host.log" 2>/dev/null && grep -q "ALLDONE" "$T/live_guest.log" 2>/dev/null; then
    echo "   两端均完成（等待 $i 秒）"
    break
  fi
  sleep 1
done
kill $HP $GP 2>/dev/null
wait 2>/dev/null

HASH_H=$(grep -oE "DONE role=host frames=[0-9]+ hash=-?[0-9]+" "$T/live_host.log" | head -1)
HASH_G=$(grep -oE "DONE role=guest frames=[0-9]+ hash=-?[0-9]+" "$T/live_guest.log" | head -1)
echo "   host : $HASH_H"
echo "   guest: $HASH_G"
h1=$(echo "$HASH_H" | grep -oE "hash=-?[0-9]+")
h2=$(echo "$HASH_G" | grep -oE "hash=-?[0-9]+")
echo ""
if [ -n "$h1" ] && [ "$h1" = "$h2" ]; then
  echo "✅ 公网联机 VERIFY OK：双进程 400 帧状态哈希一致（$h1）"
else
  echo "❌ 公网联机 FAIL"
fi

echo ""
echo "== ③ 公网联机大厅截图 =="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --window-size=1280,720 --virtual-time-budget=8000 --user-data-dir="$T/nlc6" \
  --screenshot="$T/nl_live_netmenu.png" "$U/tools/browsercheck.html#netmenu" >/dev/null 2>&1
if [ -f "$T/nl_live_netmenu.png" ]; then
  cp "$T/nl_live_netmenu.png" "预览截图/新功能_6_公网联机大厅.png"
  echo "  ok -> 预览截图/新功能_6_公网联机大厅.png"
fi
