#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""colors_extract.py — 从官方立绘提取空间色板（3x3 区域主色 + 关键部位采样）
用法: python tools/colors_extract.py 图1 [图2 ...]
透明图按 alpha 蒙版统计；不透明图按角点背景剔除。
"""
import sys, os, colorsys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
sys.stdout.reconfigure(encoding="utf-8")

def dominant(px, k=4):
    if not px:
        return []
    from collections import Counter
    cnt = Counter(px)
    return ["#%02x%02x%02x x%d" % (r, g, b, c) for (r, g, b), c in cnt.most_common(k)]

def quantize_px(px):
    """粗略量化到 24 级减少噪声"""
    out = []
    for r, g, b in px:
        out.append((r // 24 * 24 + 12, g // 24 * 24 + 12, b // 24 * 24 + 12))
    return out

def extract(fp):
    print("=" * 66)
    print("FILE:", os.path.basename(fp))
    im = Image.open(fp).convert("RGBA")
    w, h = im.size
    # bbox
    bbox = im.getchannel("A").getbbox() if im.getchannel("A").getextrema()[1] < 255 or im.getchannel("A").getextrema()[0] < 255 else None
    if bbox is None:
        bbox = (0, 0, w, h)
    x0, y0, x1, y1 = bbox
    bw, bh = x1 - x0, y1 - y0
    print("bbox:", bbox, "size %dx%d" % (bw, bh))
    # 逐区域采样
    for gy in range(3):
        row = []
        for gx in range(3):
            cx0 = x0 + bw * gx // 3; cx1 = x0 + bw * (gx + 1) // 3
            cy0 = y0 + bh * gy // 3; cy1 = y0 + bh * (gy + 1) // 3
            crop = im.crop((cx0, cy0, cx1, cy1))
            px = [p[:3] for p in crop.getdata() if p[3] > 200]
            if len(px) > 30:
                q = quantize_px(px[::max(1, len(px) // 4000)])
                row.append(dominant(q, 2))
            else:
                row.append(["(空)"])
        print("  row%d: %s" % (gy + 1, " | ".join(", ".join(c) for c in row)))
    # 全图主色（按不透明像素）
    px = [p[:3] for p in im.getdata() if p[3] > 200]
    print("  ALL:", "; ".join(dominant(quantize_px(px[::max(1, len(px) // 20000)]), 8)))

if __name__ == "__main__":
    for fp in sys.argv[1:]:
        try:
            extract(fp)
        except Exception as e:
            print("FAIL", fp, repr(e))
