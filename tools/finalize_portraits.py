#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""finalize_portraits.py — 定稿打包 9 张立绘（奶娃九形态）：
  连通域去碎片(可选) → 裁透明边 → 加衬边 → 统一 800×800 画布 → 存 立绘/<id>.png
用法: python tools/finalize_portraits.py [--check]
"""
import os, sys
import numpy as np
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
from scipy import ndimage

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(BASE, "原版素材")
OUTDIR = os.path.abspath(os.path.join(BASE, "..", "立绘"))
CANVAS = 800

# id -> (源文件, 是否去碎片, 说明)
MAPPING = {
    "loving":   ("bili/cut/loving_src.png",   True, "慈爱模式（B站九宫格·绿）"),
    "dark":     ("bili/cut/dark_src.png",     True, "暗黑模式（黑）"),
    "rage":     ("bili/cut/rage_src.png",     True, "愤怒模式（红）"),
    "war":      ("bili/cut/war_src.png",      True, "战斗模式（深色）"),
    "nailoong": ("bili/cut/nailoong_src.png", True, "奶龙模式（金黄）"),
    "void":     ("bili/cut/void_src.png",     True, "空虚模式（白灰）"),
    "tender":   ("bili/cut/tender_src.png",   True, "温柔模式（粉）"),
    "divine":   ("bili/cut/divine_src.png",   True, "神龙模式（棕金）"),
    "sad":      ("bili/cut/sad_src.png",      True, "忧郁模式（蓝）"),
}
ALT = {}  # 备选池（不打包）


def comp_report(image):
    a = np.array(image)
    lab, n = ndimage.label(a[:, :, 3] > 10)
    sizes = sorted(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)).astype(int), reverse=True)
    return n, sizes[:6]


def keep_largest(im, thresh=10):
    a = np.array(im)
    mask = a[:, :, 3] > thresh
    lab, n = ndimage.label(mask)
    if n <= 1:
        return im
    keep = int(np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)))) + 1
    out = a.copy()
    out[lab != keep, 3] = 0
    return Image.fromarray(out, "RGBA")


def trim(im, pad_ratio=0.05):
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return im
    im = im.crop(bbox)
    w, h = im.size
    pad = int(max(w, h) * pad_ratio)
    cw = ch = max(w, h) + pad * 2
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    canvas.paste(im, ((cw - w) // 2, (ch - h) // 2), im)
    return canvas


def fit(im, size=CANVAS):
    """等比缩放（允许放大）让最长边贴合画布，居中放置"""
    im = im.copy()
    s = size / max(im.size)
    nw = max(1, round(im.size[0] * s))
    nh = max(1, round(im.size[1] * s))
    im = im.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - nw) // 2, (size - nh) // 2), im)
    return canvas


def main():
    check_only = "--check" in sys.argv
    os.makedirs(OUTDIR, exist_ok=True)
    print("OUTDIR:", OUTDIR)
    for cid, (rel, use_comp, note) in MAPPING.items():
        src = os.path.join(P, rel)
        if not os.path.exists(src):
            print("!! MISSING", cid, src); continue
        im = Image.open(src).convert("RGBA")
        n0, sizes0 = comp_report(im)
        if use_comp:
            im = keep_largest(im)
        n1, sizes1 = comp_report(im)
        im = trim(im)
        im = fit(im)
        frac = float((np.array(im)[:, :, 3] > 16).mean())
        dst = os.path.join(OUTDIR, cid + ".png")
        if not check_only:
            im.save(dst)
        print("%-10s %-26s comp %d->%d %s fill=%.2f %s" % (cid, rel, n0, n1, sizes1[1:4], frac, note))
    for aid, rel in ALT.items():
        src = os.path.join(P, rel)
        if os.path.exists(src):
            im = Image.open(src).convert("RGBA")
            n0, _ = comp_report(im)
            frac = float((np.array(im)[:, :, 3] > 16).mean())
            print("ALT %-6s %-34s comp=%d fill=%.2f" % (aid, rel, n0, frac))


if __name__ == "__main__":
    main()
