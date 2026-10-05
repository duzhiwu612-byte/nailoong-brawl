#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""s360.py — 360 图搜专项工具
  python tools/s360.py search "关键词1" ["关键词2" ...]     # 只搜不下载，输出候选表
  python tools/s360.py dl URL1 URL2 ...                    # 下载指定 URL 到 raw2/ + 质检
"""
import urllib.request, urllib.parse, json, os, sys, time, colorsys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "原版素材")
RAW2 = os.path.join(OUT, "raw2")
os.makedirs(RAW2, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

def so360(q, pn=60):
    url = "https://image.so.com/j?q=%s&src=srp&sn=0&pn=%d" % (urllib.parse.quote(q), pn)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://image.so.com/"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore"))

def parse_size(s):
    s = (s or "").upper().replace(" ", "")
    try:
        if s.endswith("KB"): return float(s[:-2]) * 1024
        if s.endswith("MB"): return float(s[:-2]) * 1024 * 1024
        return float(s)
    except Exception:
        return 0

def search(queries):
    for q in queries:
        d = so360(q)
        rows = []
        for it in d.get("list", []):
            w = int(float(it.get("width") or 0)); h = int(float(it.get("height") or 0))
            t = (it.get("imgtype") or "").upper()
            u = it.get("img") or ""
            if not u or w < 500 or h < 500 or t == "GIF":
                continue
            rows.append((w, h, t, (it.get("title") or "")[:46], u))
        print("### %s -> %d" % (q, len(rows)))
        for w, h, t, title, u in rows[:40]:
            print("  %dx%d %-4s %s | %s" % (w, h, t, title, u))
        with open(os.path.join(OUT, "search_%s.json" % urllib.parse.quote(q)), "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=1)

def qc(fp):
    im = Image.open(fp); im.load()
    w, h = im.size
    has_a = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    sm = im.convert("RGBA"); th = sm.copy(); th.thumbnail((64, 64))
    px = list(th.getdata()); n = len(px)
    tf = round(sum(1 for r, g, b, a in px if a < 16) / n, 3) if has_a else None
    q = th.convert("RGB").quantize(colors=6, method=Image.MEDIANCUT)
    pal = q.getpalette()[:18]
    doms = ["#%02x%02x%02x" % tuple(pal[idx * 3:idx * 3 + 3]) for c, idx in sorted(q.getcolors(), reverse=True)[:6]]
    return " %dx%d a=%s tf=%s dom=%s" % (w, h, has_a, tf, ",".join(doms[:4]))

def dl(urls):
    for i, u in enumerate(urls):
        ext = "png" if u.lower().split("?")[0].endswith(".png") else "jpg"
        fn = "d%02d.%s" % (i, ext)
        fp = os.path.join(RAW2, fn)
        try:
            req = urllib.request.Request(u, headers={"User-Agent": UA})
            data = urllib.request.urlopen(req, timeout=40).read()
            if len(data) < 4000:
                raise ValueError("small %d" % len(data))
            open(fp, "wb").write(data)
            print("OK", fn, qc(fp), u[:80])
        except Exception as e:
            print("FAIL", u[:90], repr(e))
        time.sleep(0.15)

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "search":
        search(sys.argv[2:])
    elif len(sys.argv) > 2 and sys.argv[1] == "dl":
        dl(sys.argv[2:])
    else:
        print(__doc__)
