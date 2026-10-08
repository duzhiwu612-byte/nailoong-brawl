#!/usr/bin/env bash
# 三大新功能截图 + QC：弹道对撞 / 自选AI对手 / 联机大厅
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
BASE="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97"
OUT="预览截图"

shot() { # $1=hash $2=name
  "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
    --enable-logging=stderr --v=0 --virtual-time-budget=8000 --window-size=1280,720 \
    --screenshot="$T/$2.png" "$BASE/tools/browsercheck.html#$1" 2>&1 \
    | grep -oE "\[BROWSERCHECK\][^\"]*" | head -8
  if [ -f "$T/$2.png" ]; then cp "$T/$2.png" "$OUT/$2.png" && echo "  ok -> $OUT/$2.png"; else echo "  FAIL $2"; fi
}

echo "== ① 弹道对撞（互消瞬间）=="
shot clash "新功能_1_弹道对撞"
echo "== ② 自选AI对手（选对手界面）=="
shot aipick "新功能_2_自选AI对手"
echo "== ③ 联机大厅（菜单）=="
shot netmenu "新功能_3_联机大厅"
echo "== ④ 联机大厅（房间码）=="
shot nethost "新功能_4_房间码"
echo "== ⑤ 联机大厅（输入房间码）=="
shot netjoin "新功能_5_输入房间码"

echo ""
echo "== 像素核查 =="
.venv-gfx/Scripts/python.exe tools/probe_features.py
