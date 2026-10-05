#!/usr/bin/env bash
# 手机端截图 + 触屏功能自检
cd "/c/Users/hp/Documents/奶龙大乱斗" || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
T="$LOCALAPPDATA/Temp"
OUT="预览截图"
BASE="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97"

shot() { # $1=W $2=H $3=url $4=name
  "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
    --window-size="$1,$2" --virtual-time-budget=7000 \
    --run-all-compositor-stages-before-draw \
    --screenshot="$T/$4" "$3" >/dev/null 2>&1
  if [ -f "$T/$4" ]; then cp "$T/$4" "$OUT/$4" && echo "  ok -> $OUT/$4"; else echo "  FAIL $4"; fi
}

echo "== ① 竖屏（旋转提示）=="
shot 390 844 "$BASE/index.html?touch=1" "手机_1_竖屏提示.png"
echo "== ② 横屏标题（菜单键）=="
shot 880 400 "$BASE/index.html?touch=1" "手机_2_标题页触控.png"
echo "== ③ 横屏战斗（战斗键）=="
shot 880 400 "$BASE/tools/browsercheck.html?touch=1#battle" "手机_3_战斗触控.png"
echo "== ④ 桌面回归（应无任何触控按钮）=="
shot 1280 720 "$BASE/index.html" "手机_4_桌面无触控.png"

echo ""
echo "== 触屏功能自检（启用态 ?touch=1）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=4000 \
  --screenshot="$T/nl_touchcheck.png" \
  "$BASE/tools/touchcheck.html?touch=1" 2>&1 | grep -oE "\[TOUCHCHECK\][^\"]*" | head -30
echo "== 触屏禁用态（?touch=0，模拟桌面）=="
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --enable-logging=stderr --v=0 --virtual-time-budget=3000 \
  --screenshot="$T/nl_touchcheck_off.png" \
  "$BASE/tools/touchcheck.html?touch=0" 2>&1 | grep -oE "\[TOUCHCHECK\][^\"]*" | head -10

echo ""
echo "== 手机截图像素核查 =="
.venv-gfx/Scripts/python.exe tools/probe_mobile.py
