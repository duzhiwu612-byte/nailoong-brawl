#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""head_dir_probe.py — 判断头像照片里人物的朝向（左/右）
原理：脸部（亮/暖色皮肤）质心相对头像框中心的水平偏移 + 暗色（头发）质心偏移。
配合 ASCII 灰度图人工核对。
用法: python tools/head_dir_probe.py 图1.png 图2.png ...
"""
import sys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
sys.stdout.reconfigure(encoding="utf-8")


def gray_map(im, cols=72):
    im = im.convert("RGBA")
    im = im.crop(im.getbbox() or (0, 0, im.size[0], im.size[1]))
    w, h = im.size
    th = max(8, int(cols * h / w / 2.15))
    t = im.copy(); t.thumbnail((cols, th))
    px = t.load()
    ramp = " .:-=+*#%@"
    out = []
    for y in range(t.size[1]):
        row = ""
        for x in range(t.size[0]):
            r, g, b, a = px[x, y]
            if a < 40:
                row += " "
                continue
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            row += ramp[min(len(ramp) - 1, int(lum * len(ramp)))]
        out.append(row)
    return out


def skin_side(im):
    """返回 (皮肤亮区质心水平位置 0..1, 头发暗区质心水平位置 0..1)"""
    im = im.convert("RGB")
    im = im.crop(im.getbbox() or (0, 0, im.size[0], im.size[1]))
    im = im.resize((64, 64))
    px = im.load()
    sx = sy = sn = 0
    hx = hy = hn = 0
    for y in range(64):
        for x in range(64):
            r, g, b = px[x, y]
            mx, mn = max(r, g, b), min(r, g, b)
            # 皮肤：暖色且较亮
            if r > 95 and g > 40 and b > 20 and r > g > b and (mx - mn) > 15 and r - b > 15 and r > 110:
                sx += x; sy += y; sn += 1
            # 暗色（头发/阴影）
            elif (r + g + b) / 3 < 60:
                hx += x; hy += y; hn += 1
    fx = sx / sn / 63 if sn else -1
    hxr = hx / hn / 63 if hn else -1
    return fx, hxr, sn, hn


for path in sys.argv[1:]:
    try:
        im = Image.open(path)
    except Exception as e:
        print("!! 打不开:", path, e)
        continue
    print("=" * 74)
    print("FILE:", path, im.size, im.mode)
    fx, hxr, sn, hn = skin_side(im)
    print("  皮肤质心x=%.2f (0=左 1=右, n=%d)   暗区质心x=%.2f (n=%d)" % (fx, sn, hxr, hn))
    for row in gray_map(im):
        print("  " + row)
