#!/usr/bin/env bash
# 渲染 品牌/brandkit.html → PNG（headless Chrome），并捕获 console 日志
set -e
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
PY="/c/Users/hp/Documents/奶龙大乱斗/.venv-gfx/Scripts/python.exe"

SCALE=${1:-1}
SUF=""; EXTRA=""
if [ "$SCALE" != "1" ]; then SUF="@${SCALE}x"; EXTRA="--force-device-scale-factor=$SCALE"; fi

URL=$("$PY" -c "import pathlib,urllib.parse; p=pathlib.Path('C:/Users/hp/Documents/奶龙大乱斗/品牌/brandkit.html'); print('file:///'+urllib.parse.quote(p.as_posix()))")
echo "URL=$URL  SCALE=$SCALE"
case "$URL" in *%*) echo "URL-encoded ok";; *) echo "URL-ENCODE FAIL"; exit 1;; esac

OUT="$LOCALAPPDATA/Temp/brandkit_v1${SUF}.png"
LOG="$LOCALAPPDATA/Temp/brandkit_v1${SUF}.log"
PROF="$LOCALAPPDATA/Temp/prof_bk1"
rm -f "$OUT" "$LOG"
rm -rf "$PROF"

"$CHROME" --headless=new --disable-gpu --no-first-run --hide-scrollbars --mute-audio \
  --allow-file-access-from-files $EXTRA \
  --enable-logging=stderr --v=0 \
  --window-size=2400,1800 --virtual-time-budget=20000 \
  --user-data-dir="$PROF" \
  --screenshot="$OUT" \
  "$URL" 2> "$LOG" || echo "chrome-exit=$?"

ls -la "$OUT" 2>/dev/null || { echo "NO PNG"; tail -5 "$LOG"; exit 1; }
md5sum "$OUT"
echo "--- console errors (if any) ---"
grep -aiE "error|failed|uncaught|SyntaxError" "$LOG" | grep -av "GPU\|gpu\|Fontconfig\|DevTools\|Gpu\|bluetooth\|Bluetooth" | head -15 || echo "(none)"
echo "DONE"
