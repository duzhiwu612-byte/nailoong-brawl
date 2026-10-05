#!/usr/bin/env bash
# 选人页捕捉对照实验：独立跑 vs 序列跑（title 后跑）
cd "/c/Users/hp/Documents/奶龙大乱斗"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
U="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97/tools/browsercheck.html"
run() {  # $1=scene $2=outname
  "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
    --enable-logging=stderr --v=0 --window-size=1280,720 --virtual-time-budget=22000 \
    --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling \
    --screenshot="$T/$2.png" "$U#$1" > "$T/$2.log" 2>&1
}

echo "== A: 独立 select（本机第 1 个 chrome 进程）=="
run select seq_a
grep -a -o '\[BROWSERCHECK\][^"]*' "$T/seq_a.log" | grep -E "naiwa|charOrder|ERROR|DONE" | head -6
python tools/check_select_shot.py "$T/seq_a.png" || echo "(A 未过)"
echo ""
echo "== B: 先 title 再 select（select 是第 2 个 chrome 进程）=="
run title seq_b1
run select seq_b2
grep -a -o '\[BROWSERCHECK\][^"]*' "$T/seq_b2.log" | grep -E "naiwa|charOrder|ERROR|DONE" | head -8
python tools/check_select_shot.py "$T/seq_b2.png" || echo "(B 未过)"
