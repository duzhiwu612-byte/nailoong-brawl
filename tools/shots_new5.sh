#!/usr/bin/env bash
# v0.12 班友参战截图套件：5 新角色机制 + 替身术 + 选人阵容
cd "$(dirname "$0")/.." || exit 1
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
TMPDIR2="$LOCALAPPDATA/Temp"   # 注意：不能用 ${TMP:-...}（MSYS /tmp 原生 Chrome 写不进去！）
PROJ_URL="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97/tools"
mkdir -p 预览截图

shoot() {
  "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
    --enable-logging=stderr --v=0 --window-size=1280,720 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=22000 \
    --screenshot="$TMPDIR2/nl8_$1.png" "$PROJ_URL/browsercheck.html#$1" > "$TMPDIR2/nl8_$1.log" 2>&1
}

for scene in kugua kuguap kuguaslip laser tallguy jiuyi laobai subst newsel bottle2 flip getupinv board2 smoke1 smokefire rain2 pile2 burn2; do
  shoot "$scene"
  echo "--- $scene ---"
  grep -a -o '"\[BROWSERCHECK\][^"]*"' "$TMPDIR2/nl8_$scene.log" | grep -v "boot\|scene ->\|DONE\|portraits" | head -4 || true
  grep -a -o 'errors=[0-9]*[^"]*' "$TMPDIR2/nl8_$scene.log" | head -1 || true
done

cp "$TMPDIR2/nl8_kugua.png"    "预览截图/班友_1_香蕉抛物.png"
cp "$TMPDIR2/nl8_kuguap.png"   "预览截图/班友_2_蕉皮留地.png"
cp "$TMPDIR2/nl8_kuguaslip.png" "预览截图/班友_3_踩到香蕉皮.png"
cp "$TMPDIR2/nl8_laser.png"    "预览截图/班友_4_镭射眼.png"
cp "$TMPDIR2/nl8_tallguy.png"  "预览截图/班友_5_大高个对比.png"
cp "$TMPDIR2/nl8_jiuyi.png"    "预览截图/班友_6_九一音波.png"
cp "$TMPDIR2/nl8_laobai.png"   "预览截图/班友_7_火柱水渍.png"
cp "$TMPDIR2/nl8_subst.png"    "预览截图/班友_8_替身木桩.png"
cp "$TMPDIR2/nl8_newsel.png"   "预览截图/班友_9_选人阵容.png"
cp "$TMPDIR2/nl8_bottle2.png"  "预览截图/班友_10_酒瓶炸开水渍.png"
cp "$TMPDIR2/nl8_flip.png"     "预览截图/班友_11_翻转后对战.png"
cp "$TMPDIR2/nl8_getupinv.png" "预览截图/班友_12_起身无敌.png"
cp "$TMPDIR2/nl8_board2.png"    "预览截图/班友_16_黑板之盾.png"
cp "$TMPDIR2/nl8_smoke1.png"    "预览截图/班友_17_迷雾战场.png"
cp "$TMPDIR2/nl8_smokefire.png" "预览截图/班友_18_烟雾大爆炸.png"
cp "$TMPDIR2/nl8_rain2.png"     "预览截图/班友_19_全屏香蕉雨.png"
cp "$TMPDIR2/nl8_pile2.png"     "预览截图/班友_20_手机堆挡路.png"
cp "$TMPDIR2/nl8_burn2.png"     "预览截图/班友_21_灼烧状态.png"

echo ""
echo "=== 像素 QC ==="
python tools/probe_new5.py
