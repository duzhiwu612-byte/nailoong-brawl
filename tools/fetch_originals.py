#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""fetch_originals.py — 从 360 图搜批量抓取"奶龙/暴暴龙"原版素材候选 + 自动质检
产出：
  tools/原版素材/raw/        下载的原始图片
  tools/原版素材/manifest.json  每张图的元数据 + 质检结果
"""
import urllib.request, urllib.parse, json, os, sys, time, re, colorsys
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "原版素材")
RAW = os.path.join(OUT, "raw")
os.makedirs(RAW, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

QUERIES = ["奶龙 官方", "奶龙 png 透明", "奶龙 免抠", "奶龙 三视图", "奶龙 立绘", "奶龙 表情包", "暴暴龙", "奶龙 大笑"]

def so360(q, sn=0, pn=60):
    url = "https://image.so.com/j?q=%s&src=srp&sn=%d&pn=%d" % (urllib.parse.quote(q), sn, pn)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://image.so.com/"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore"))

def parse_size(s):
    s = (s or "").upper().replace(" ", "")
    try:
        if s.endswith("KB"): return float(s[:-2]) * 1024
        if s.endswith("MB"): return float(s[:-2]) * 1024 * 1024
        if s.endswith("B"):  return float(s[:-1])
        return float(s)
    except Exception:
        return 0

def collect():
    all_items = []
    for q in QUERIES:
        try:
            d = so360(q)
        except Exception as e:
            print("QUERY FAIL", q, repr(e)); continue
        n = 0
        for it in d.get("list", []):
            u = it.get("img") or ""
            w = int(float(it.get("width") or 0)); h = int(float(it.get("height") or 0))
            sz = parse_size(it.get("imgsize"))
            t = (it.get("imgtype") or "").upper()
            if not u.startswith("http"): continue
            if w < 400 or h < 400: continue
            if w * h > 3000 * 3000: continue
            if sz and sz < 30000: continue
            if t in ("GIF",): continue
            if t and t not in ("PNG", "JPG", "JPEG", "WEBP"): continue
            all_items.append({"q": q, "url": u, "w": w, "h": h, "sz": sz, "type": t,
                              "title": (it.get("title") or "")[:80],
                              "site": it.get("site") or "", "link": it.get("link") or ""})
            n += 1
        print("QUERY %s -> %d" % (q, n))
    seen = set(); items = []
    for it in all_items:
        k = it["url"].split("?")[0]
        if k in seen: continue
        seen.add(k); items.append(it)
    return items

def download(items, limit=220):
    manifest = []
    for i, it in enumerate(items[:limit]):
        ext = (it["type"] or "").lower()
        if ext == "jpeg": ext = "jpg"
        if not ext: ext = "png" if ".png" in it["url"].lower() else "jpg"
        fn = "c%03d.%s" % (i, ext)
        fp = os.path.join(RAW, fn)
        ok = False; err = ""
        for attempt in range(2):
            try:
                hdr = {"User-Agent": UA}
                if attempt == 1:
                    hdr["Referer"] = "https://image.so.com/"
                req = urllib.request.Request(it["url"], headers=hdr)
                raw = urllib.request.urlopen(req, timeout=40).read()
                if len(raw) < 5000:
                    raise ValueError("too small %d" % len(raw))
                open(fp, "wb").write(raw)
                ok = True; break
            except Exception as e:
                err = repr(e); time.sleep(0.4)
        rec = dict(it); rec.update({"file": fn if ok else "", "ok": ok, "err": err})
        manifest.append(rec)
        if (i + 1) % 20 == 0:
            print("dl %d/%d" % (i + 1, min(len(items), limit)))
        time.sleep(0.12)
    return manifest

def qc(manifest):
    report = []
    for rec in manifest:
        if not rec["ok"]:
            report.append(rec); continue
        fp = os.path.join(RAW, rec["file"])
        try:
            im = Image.open(fp); im.load()
        except Exception as e:
            rec["qc_err"] = repr(e); report.append(rec); continue
        w, h = im.size
        rec["real_w"], rec["real_h"] = w, h
        rec["fmt"] = im.format
        has_a = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        rec["alpha"] = bool(has_a)
        small = im.convert("RGBA")
        th = small.copy(); th.thumbnail((64, 64))
        px = list(th.getdata())
        n = len(px)
        if has_a:
            trans = sum(1 for r, g, b, a in px if a < 16)
            rec["trans_frac"] = round(trans / n, 3)
        q = th.convert("RGB").quantize(colors=6, method=Image.MEDIANCUT)
        pal = q.getpalette()[:18]
        cnt = sorted(q.getcolors(), reverse=True)
        doms = []
        for c, idx in cnt[:6]:
            rgb = pal[idx * 3:idx * 3 + 3]
            doms.append("#%02x%02x%02x" % tuple(rgb))
        rec["dom"] = doms
        yel = blu = whi = 0
        for r, g, b, a in px:
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.09 <= hh <= 0.20 and ss > 0.25 and vv > 0.55: yel += 1
            if 0.50 <= hh <= 0.72 and ss > 0.20 and vv > 0.35: blu += 1
            if ss < 0.12 and vv > 0.82: whi += 1
        rec["yellow"] = round(yel / n, 3); rec["blue"] = round(blu / n, 3); rec["white"] = round(whi / n, 3)
        report.append(rec)
    return report

def main():
    items = collect()
    print("collected:", len(items))
    manifest = download(items)
    rep = qc(manifest)
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=1)
    ok = [r for r in rep if r.get("ok")]
    print("downloaded:", len(ok), "/", len(rep))
    alpha_png = [r for r in ok if r.get("alpha") and r.get("trans_frac", 0) > 0.05]
    print("透明候选数:", len(alpha_png))
    for r in sorted(ok, key=lambda x: x["real_w"] * x["real_h"], reverse=True)[:70]:
        print("%s %dx%d a=%s tf=%s dom=%s y=%.2f b=%.2f w=%.2f %s" % (
            r["file"], r["real_w"], r["real_h"], r.get("alpha"),
            r.get("trans_frac", "-"), ",".join(r.get("dom", [])[:3]),
            r.get("yellow", 0), r.get("blue", 0), r.get("white", 0), r["title"][:28]))

if __name__ == "__main__":
    main()
