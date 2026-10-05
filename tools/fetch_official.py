#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""fetch_official.py — 下载 nailoong.com 官方原版素材（IP 页面）+ 质检
产出 tools/原版素材/official/
"""
import urllib.request, os, sys, json, colorsys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "原版素材", "official")
os.makedirs(OUT, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

FILES = [
    # 奶龙页
    "ipStar/image_nailoong.png", "ipStar/slogan_nl.png", "ipStar/logo_nailoong.png",
    "ipStar/brand_image.png", "ipStar/brandStory.png",
    "ipStar/wallpaper_one.png", "ipStar/wallpaper_two.png",
    "ipStar/publication_bukai_xin.png", "ipStar/publication.png",
    "ipStar/manga_item_1.png", "ipStar/manga_item_2.png", "ipStar/manga_item_3.png", "ipStar/manga_item_4.png",
    "ipStar/televisionSeries.png", "ipStar/television_one.png", "ipStar/television_two.png",
    "ipStar/television_three.png", "ipStar/television_four.png",
    "ipStar/audiobook_jiemi.png", "ipStar/audioBook.png",
    "ipStar/animationIpStar.png", "ipStar/2dContent.png",
    "main_view_image.png", "stars/star_image_nl.png", "stars/icon_nl.png",
    # 暴暴龙页
    "ipStar/bombloong/bombloong.png", "ipStar/bombloong/preview_bombloong.png",
    "ipStar/bombloong/logo_bombloong.png", "ipStar/bombloong/purtato.png",
    "ipStar/bombloong/preview_dalaba.png", "ipStar/bombloong/emotion.png",
    "ipStar/bombloong/music_character.png", "ipStar/bombloong/music.png",
    "ipStar/bombloong/business_linkage.png", "ipStar/bombloong/business_9.png",
    "ipStar/bombloong/wallpaper.png", "ipStar/bombloong/wallpaper_1.png",
    "ipStar/bombloong/wallpaper_2.png", "ipStar/bombloong/wallpaper_3.png",
] + ["ipStar/bombloong/emotion_Frame_%d.png" % n for n in [96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107]] \
  + ["ipStar/bombloong/button_icon_%s.png" % s for s in ["dalaba", "junshi", "bugaoxing", "xiaomihu", "xiaojiling"]]

def fetch(path):
    for base in ("https://www.nailoong.com/_ipx/q_85/img/", "https://www.nailoong.com/img/"):
        url = base + path
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://www.nailoong.com/"})
            data = urllib.request.urlopen(req, timeout=40).read()
            if len(data) > 800:
                return url, data
        except Exception:
            pass
    return None, None

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
    yel = blu = 0
    for r, g, b, a in px:
        hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if 0.09 <= hh <= 0.20 and ss > 0.25 and vv > 0.55: yel += 1
        if 0.50 <= hh <= 0.72 and ss > 0.20 and vv > 0.35: blu += 1
    return dict(size=[w, h], fmt=im.format, alpha=bool(has_a), tf=tf, dom=doms,
                y=round(yel / n, 2), b=round(blu / n, 2))

def main():
    report = {}
    for path in FILES:
        name = path.split("/")[-1]
        url, data = fetch(path)
        rec = {"url": url, "ok": False}
        if url and data:
            fp = os.path.join(OUT, name)
            open(fp, "wb").write(data)
            try:
                rec.update(qc(fp))
                rec["ok"] = True
                rec["bytes"] = len(data)
            except Exception as e:
                rec["qc_err"] = repr(e)
        report[path] = rec
        if rec.get("ok"):
            print("OK  %-42s %sx%s a=%s tf=%s y=%.2f b=%.2f dom=%s" % (
                name, rec["size"][0], rec["size"][1], rec["alpha"], rec["tf"], rec["y"], rec["b"], ",".join(rec["dom"][:4])))
        else:
            print("FAIL", path, rec.get("url") or "no-url")
    with open(os.path.join(BASE, "原版素材", "official_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    ok = sum(1 for r in report.values() if r.get("ok"))
    print("TOTAL ok:", ok, "/", len(FILES))

if __name__ == "__main__":
    main()
