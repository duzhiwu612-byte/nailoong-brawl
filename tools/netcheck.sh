#!/usr/bin/env bash
# 联机端到端测试：① 同页内存链路（确定性） ② 双进程真实联机（PeerJS 云信令 + WebRTC 回环）
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
BASE="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97"
CODE="QA$(( RANDOM % 90 + 10 ))$(( RANDOM % 90 + 10 ))"

echo "== ① 同页内存链路（同步确定性跑 600 帧）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=8000 \
  --screenshot="$T/nl_check_netfake.png" \
  "$BASE/tools/netcheck.html?role=fake&frames=600" 2>&1 | grep -oE "\[NETCHECK\][^\"]*" | head -6

echo ""
echo "== ② 双进程真实联机（code=$CODE）=="
rm -f "$T/net_host.log" "$T/net_guest.log"
timeout 45 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlc1" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$BASE/tools/netcheck.html?role=host&code=$CODE&frames=400" > "$T/net_host.log" 2>&1 &
HP=$!
sleep 2
timeout 45 "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$T/nlc2" --disable-features=WebRtcHideLocalIpsWithMdns \
  --enable-logging=stderr --v=0 \
  "$BASE/tools/netcheck.html?role=guest&code=$CODE&frames=400" > "$T/net_guest.log" 2>&1 &
GP=$!

for i in $(seq 1 60); do
  if grep -q "ALLDONE" "$T/net_host.log" 2>/dev/null && grep -q "ALLDONE" "$T/net_guest.log" 2>/dev/null; then
    echo "   两端均完成（等待 $i 秒）"
    break
  fi
  sleep 1
done
kill $HP $GP 2>/dev/null
wait 2>/dev/null

echo "---- host 日志 ----"
grep -oE "\[NETCHECK\][^\"]*" "$T/net_host.log" | tail -8
echo "---- guest 日志 ----"
grep -oE "\[NETCHECK\][^\"]*" "$T/net_guest.log" | tail -8

HH=$(grep -oE "DONE role=host frames=[0-9]+ hash=-?[0-9]+" "$T/net_host.log" | head -1)
GH=$(grep -oE "DONE role=guest frames=[0-9]+ hash=-?[0-9]+" "$T/net_guest.log" | head -1)
HASH_H=$(echo "$HH" | grep -oE "hash=-?[0-9]+")
HASH_G=$(echo "$GH" | grep -oE "hash=-?[0-9]+")
echo ""
if [ -n "$HASH_H" ] && [ "$HASH_H" = "$HASH_G" ]; then
  echo "✅ REAL-NET VERIFY OK：双进程 400 帧后状态哈希一致（$HASH_H）"
else
  echo "❌ REAL-NET FAIL：host=$HASH_H guest=$HASH_G"
  echo "   host:  $HH"
  echo "   guest: $GH"
fi
