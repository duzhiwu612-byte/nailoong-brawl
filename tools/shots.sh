#!/bin/bash
# 奶龙大乱斗 · 一键生成全部预览截图（需要 Chrome；在项目根目录运行）
# 用法: bash tools/shots.sh
# v0.5+: 选人页先抓 + 虚拟时间/真实时间两种方式交替重试（无头截屏偶发竞态，自检严格）
cd "$(dirname "$0")/.." || exit 1
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
TMPDIR2="$LOCALAPPDATA/Temp"   # 注意：不能用 ${TMP:-...}（可能是 MSYS /tmp，原生 Chrome 写不进去！）
PROJ_URL="file:///C:/Users/hp/Documents/%E5%A5%B6%E9%BE%99%E5%A4%A7%E4%B9%B1%E6%96%97/tools"
mkdir -p 预览截图

shoot() {  # $1=scene $2=模式附加参数（可选）
  "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
    --enable-logging=stderr --v=0 --window-size=1280,720 \
    --run-all-compositor-stages-before-draw ${2:---virtual-time-budget=22000} \
    --screenshot="$TMPDIR2/nl5_$1.png" "$PROJ_URL/browsercheck.html#$1" > "$TMPDIR2/nl5_$1.log" 2>&1
}

# ① 选人页最先抓（历史经验：排在全套序列末尾时偶发丢卡）；两种方式交替重试
SELECT_OK=0
for attempt in 1 2 3 4; do
  if [ $((attempt % 2)) = 1 ]; then MODE="--virtual-time-budget=22000"; else MODE="--timeout=14000"; fi
  shoot select "$MODE"
  echo "--- select（第 $attempt 次，$( [ "$MODE" = "--timeout=14000" ] && echo 真实时间 || echo 虚拟时间 )）---"
  grep -a -o '"\[BROWSERCHECK\][^"]*"' "$TMPDIR2/nl5_select.log" | head -8 || true
  if python tools/check_select_shot.py "$TMPDIR2/nl5_select.png"; then
    SELECT_OK=1
    echo "✔ 选人页捕捉成功（第 $attempt 次）"
    break
  fi
  echo "⚠ 第 $attempt 次未完整捕捉，换方式重试..."
  sleep 1
done
[ "$SELECT_OK" = "1" ] || echo "⚠⚠ 选人页 4 次均未完整捕捉，请检查游戏本身"

# ② 其余场景
for scene in title battle arena dash gallery; do
  shoot "$scene"
  echo "--- $scene ---"
  grep -a -o '"\[BROWSERCHECK\][^"]*"' "$TMPDIR2/nl5_$scene.log" | head -30 || true
done

cp "$TMPDIR2/nl5_title.png"   "预览截图/1_标题页.png"
cp "$TMPDIR2/nl5_select.png"  "预览截图/2_选人界面.png"
cp "$TMPDIR2/nl5_battle.png"  "预览截图/3_战斗画面.png"
cp "$TMPDIR2/nl5_gallery.png" "预览截图/4_角色图鉴.png"
cp "$TMPDIR2/nl5_arena.png"   "预览截图/5_大地图与多层平台.png"
cp "$TMPDIR2/nl5_dash.png"    "预览截图/6_虚步残影.png"

# ③ 原版立绘一览
"$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --window-size=1280,900 --virtual-time-budget=22000 \
  --screenshot="$TMPDIR2/nl5_sheet.png" "$PROJ_URL/portraitsheet.html" > /dev/null 2>&1
cp "$TMPDIR2/nl5_sheet.png" "预览截图/7_原版立绘一览.png"

echo ""
echo "全部截图完成 -> 预览截图/"
ls -la 预览截图/
