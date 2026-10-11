#!/usr/bin/env bash
# v0.11 设计打磨截图套件：转场淡出 / 开场下落（+对照）/ 残血脉冲 + flow 转场逻辑自检
cd "$(dirname "$0")/.." || exit 1
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
TMPDIR2="$LOCALAPPDATA/Temp"   # 注意：不能用 ${TMP:-...}（MSYS /tmp 原生 Chrome 写不进去！）
PROJ_URL="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97/tools"
mkdir -p 预览截图

shoot() {
  "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
    --enable-logging=stderr --v=0 --window-size=1280,720 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=22000 \
    --screenshot="$TMPDIR2/nl6_$1.png" "$PROJ_URL/browsercheck.html#$1" > "$TMPDIR2/nl6_$1.log" 2>&1
}

for scene in title trans intro intro2 lowhp; do
  shoot "$scene"
  echo "--- $scene ---"
  grep -a -o '"\[BROWSERCHECK\][^"]*"' "$TMPDIR2/nl6_$scene.log" | head -6 || true
done

# 转场逻辑自检：不看截图，只看日志断言
shoot flow
echo "--- flow（转场逻辑）---"
grep -a -o '"\[BROWSERCHECK\] flow-[^"]*"' "$TMPDIR2/nl6_flow.log" || true
grep -a -o 'FLOW-DONE[^"]*' "$TMPDIR2/nl6_flow.log" | head -2 || true
grep -a -o 'errors=[^"]*' "$TMPDIR2/nl6_flow.log" | head -2 || true

cp "$TMPDIR2/nl6_title.png"  "预览截图/设计_0_标题对照.png"
cp "$TMPDIR2/nl6_intro.png"  "预览截图/设计_1_开场下落.png"
cp "$TMPDIR2/nl6_intro2.png" "预览截图/设计_2_开场对照.png"
cp "$TMPDIR2/nl6_trans.png"  "预览截图/设计_3_转场淡出.png"
cp "$TMPDIR2/nl6_lowhp.png"  "预览截图/设计_4_残血脉冲.png"

echo ""
echo "=== 像素 QC ==="
python tools/probe_design.py
