# -*- coding: utf-8 -*-
"""crop_forms.py — 从 B站九宫格视频帧裁出九个形态图源（按字幕位置精确去字幕带）
输出: 原版素材/bili/forms/<id>_src.png
"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
BI = os.path.join(BASE, "原版素材", "bili")
FRAME = os.path.join(BI, "frames", "f_001.png")
OUT = os.path.join(BI, "forms")
os.makedirs(OUT, exist_ok=True)

# id, 行, 列, 字幕带起始 y（格内坐标，来自 OCR 文本行的上边缘）
ITEMS = [
    ("loving",   0, 0, 180),
    ("dark",     0, 1, 210),
    ("rage",     0, 2, 196),
    ("war",      1, 0, 185),
    ("nailoong", 1, 1, 191),
    ("void",     1, 2, 180),
    ("tender",   2, 0, 175),
    ("divine",   2, 1, 198),
    ("sad",      2, 2, 187),
]

im = Image.open(FRAME).convert("RGB")
for cid, r, c, cuty in ITEMS:
    x0, y0 = c * 240, r * 240
    crop = im.crop((x0 + 2, y0 + 2, x0 + 238, y0 + cuty))
    crop.save(os.path.join(OUT, cid + "_src.png"))
    print("%-9s %s" % (cid, crop.size))
print("OUT:", OUT)
