#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""img_inspect.py — 用 ASCII 剪影 + 色板"看"图片（无头/无视觉环境下的图像核查工具）
用法: python tools/img_inspect.py 文件1 文件2 ...
"""
import sys, os, colorsys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
sys.stdout.reconfigure(encoding="utf-8")

def ascii_art(im, cols=44):
    """输出剪影 ASCII（透明图用 alpha；不透明图用角点背景色差）"""
    im = im.convert("RGBA")
    w, h = im.size
    # 背景检测：不透明图取四角平均色
    has_alpha = True
    corners = [im.getpixel((2, 2)), im.getpixel((w - 3, 2)), im.getpixel((2, h - 3)), im.getpixel((w - 3, h - 3))]
    if all(a > 240 for *_, a in corners):
        # 完全不透明 -> 用角点色做背景估计
        r0 = sum(c[0] for c in corners) / 4; g0 = sum(c[1] for c in corners) / 4; b0 = sum(c[2] for c in corners) / 4
        has_alpha = False
    else:
        r0 = g0 = b0 = 0
    tw = cols
    th = max(8, int(cols * h / w / 2.1))
    th2 = im.copy(); th2.thumbnail((tw, th))
    px = th2.load()
    lines = []
    for y in range(th2.size[1]):
        row = ""
        for x in range(th2.size[0]):
            r, g, b, a = px[x, y]
            if has_alpha:
                cov = a / 255
            else:
                d = abs(r - r0) + abs(g - g0) + abs(b - b0)
                cov = min(1.0, d / 120)
            row += " .:-=+*#%@"[min(9, int(cov * 9.99))]
        lines.append(row)
    return lines

def sample_colors(im, n=8):
    im = im.convert("RGBA")
    w, h = im.size
    # 只统计不透明像素
    th = im.copy(); th.thumbnail((100, 100))
    px = [p for p in th.getdata() if p[3] > 200]
    if not px:
        return []
    # 简易聚类：量化
    q = th.convert("RGB").quantize(colors=n, method=Image.MEDIANCUT)
    pal = q.getpalette()[:n * 3]
    cols = sorted(q.getcolors(), reverse=True)
    out = []
    for c, idx in cols[:n]:
        rgb = tuple(pal[idx * 3:idx * 3 + 3])
        hh, ss, vv = colorsys.rgb_to_hsv(*[v / 255 for v in rgb])
        out.append(("#%02x%02x%02x" % rgb, c, round(hh * 360)))
    return out

def report(fp):
    print("=" * 70)
    print("FILE:", os.path.basename(fp), os.path.getsize(fp), "B")
    try:
        im = Image.open(fp); im.load()
    except Exception as e:
        print("  OPEN FAIL:", repr(e)); return
    w, h = im.size
    im = im.convert("RGBA")
    # alpha bbox
    alpha = im.getchannel("A")
    bbox = alpha.getbbox()
    print("  size: %dx%d  mode_alpha_bbox: %s" % (w, h, bbox))
    if bbox:
        bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
        print("  bbox: %dx%d (aspect %.2f)  fill=%.0f%%" % (bw, bh, bh / max(1, bw), 100 * sum(1 for p in alpha.getdata() if p > 16) / (w * h)))
    print("  dominant colors:", sample_colors(im))
    print("  ---- silhouette ----")
    for ln in ascii_art(im):
        print("  |" + ln + "|")

if __name__ == "__main__":
    for fp in sys.argv[1:]:
        report(fp)
