# -*- coding: utf-8 -*-
# 照片构图探测：40x26 单元分类地图（B=蓝背景 . =白  S=肤色  #=深色  o=其他）
import numpy as np
from PIL import Image

SRC = r'C:\Users\hp\AppData\Roaming\Hermes\composer-images\composer_2026-10-08_01-26-52-960_b3fcb5.jpg'
im = Image.open(SRC).convert('RGB')
W, H = im.size
a = np.asarray(im).astype(np.int32)
cols, rows = 40, 26
print('W,H =', W, H)
for ry in range(rows):
    line = ''
    for rx in range(cols):
        x0 = int(rx * W / cols); x1 = int((rx + 1) * W / cols)
        y0 = int(ry * H / rows); y1 = int((ry + 1) * H / rows)
        c = a[y0:y1, x0:x1].reshape(-1, 3).mean(axis=0)
        r, g, b = c
        if b > r + 25 and b > 90: ch = 'B'
        elif r > 205 and g > 205 and b > 195: ch = '.'
        elif r > 140 and r > g + 16 and g > b + 6 and r - b > 40: ch = 'S'
        elif r < 95 and g < 95 and b < 95: ch = '#'
        else: ch = 'o'
        line += ch
    print('%2d|%s' % (ry, line))

# 关键点采样
pts = [(360, 130), (380, 190), (420, 250), (300, 260), (360, 320), (400, 380), (350, 480), (330, 600), (280, 700)]
print('')
for (x, y) in pts:
    if 0 <= x < W and 0 <= y < H:
        r, g, b = a[y, x]
        print('(%3d,%3d) rgb=(%3d,%3d,%3d)' % (x, y, r, g, b))
