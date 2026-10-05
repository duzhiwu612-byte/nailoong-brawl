# -*- coding: utf-8 -*-
"""qc_png.py — 快速质检透明 PNG：连通域数量/主色/填充率
用法: .venv-gfx/Scripts/python.exe tools/qc_png.py 图1.png [图2.png ...]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

for fp in sys.argv[1:]:
    im = Image.open(fp).convert("RGBA")
    a = np.array(im)
    lab, n = ndimage.label(a[:, :, 3] > 10)
    sizes = sorted(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)).astype(int), reverse=True)
    fill = float((a[:, :, 3] > 16).mean())
    px = a[a[:, :, 3] > 200][:, :3]
    mean = tuple(px.mean(axis=0).round(0).astype(int)) if len(px) else None
    name = fp.replace("\\", "/").split("/")[-1]
    print("%-24s %dx%d comp=%d top4=%s fill=%.2f meanRGB=%s" % (
        name, im.size[0], im.size[1], n, sizes[:4], fill, mean))
