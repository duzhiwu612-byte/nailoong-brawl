# -*- coding: utf-8 -*-
# 卡面质检：透明底检查 + 内容统计 + 输出到 立绘/xiaole.png
import os
import numpy as np
from PIL import Image
from scipy import ndimage

T = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')
src = os.path.join(T, 'xiaole_card.png')
im = Image.open(src).convert('RGBA')
a = np.asarray(im).astype(np.int32)
h, w = a.shape[:2]
corners = [int(a[4, 4, 3]), int(a[4, w - 5, 3]), int(a[h - 5, 4, 3]), int(a[h - 5, w - 5, 3])]
print('size %dx%d corners_alpha=%s' % (w, h, corners))
if max(corners) > 16:
    print('背景不透明 -> 从边界泛洪清除近白背景')
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    nw = (r > 244) * (g > 244) * (b > 244)
    lab, n = ndimage.label(nw)
    border_ids = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    border_ids.discard(0)
    kill = np.isin(lab, list(border_ids))
    a[:, :, 3] = np.where(kill, 0, a[:, :, 3])
    im = Image.fromarray(a.astype(np.uint8))
al = np.asarray(im)[:, :, 3]
ys, xs = np.where(al > 60)
if len(xs):
    print('角色 bbox: x %d..%d  y %d..%d' % (xs.min(), xs.max(), ys.min(), ys.max()))
    px = np.asarray(im).astype(np.int32)[al > 60]
    rr, gg, bb = px[:, 0], px[:, 1], px[:, 2]
    skin = int(((rr > 150) * (rr > gg + 18) * (gg > bb + 8)).sum())
    gold = int(((rr > 200) * (gg > 150) * (gg < 235) * (bb < 130)).sum())
    print('像素=%d  肤色(头部)=%d (%.1f%%)  金黄(身体)=%d (%.1f%%)' % (
        len(px), skin, skin * 100.0 / len(px), gold, gold * 100.0 / len(px)))
else:
    print('!! 无内容')
out = '立绘/xiaole.png'
im.save(out)
print('saved ->', out)
